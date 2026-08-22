import { render } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { App, listenToMessages, useAppState } from '@niivue/react'
import type { AppProps } from '@niivue/react'
import { SLICE_TYPE } from '@niivue/niivue'
import './matlab.css'

// MATLAB bridge.
//
// Control traffic uses the uihtml *event* channel (sendEventToHTMLSource /
// sendEventToMATLAB, R2023a+) rather than the Data property. Data is a single
// shared slot that only flushes when MATLAB yields, so consecutive writes
// coalesce and all but the last are lost; events queue individually. Measured
// on R2024b and R2026a: 500 events sent from a tight loop arrive as 500, in
// both directions.
//
// Volume bytes never travel over that channel. MATLAB writes the file next to
// this page and sends a URL; we fetch it from MATLAB's own connector at
// ~70 MB/s. The alternative, base64 through a property, runs at ~1 MB/s.

interface MatlabEvent {
  Data: unknown
}

interface MatlabHTMLComponent {
  addEventListener: (event: string, handler: (event: MatlabEvent) => void) => void
  sendEventToMATLAB: (name: string, data: unknown) => void
}

/** The slice of NiiVue's surface this bridge touches. */
interface NvVolume {
  name?: string
  hdr?: { dims?: number[]; pixDims?: number[]; cal_min?: number; cal_max?: number }
  cal_min?: number
  cal_max?: number
  colormap?: string
  opacity?: number
  nFrame4D?: number
  id?: string
  getValue?: (...voxel: number[]) => number
}

interface NvLocation {
  mm: number[]
  vox: number[]
  values: { name: string; value: number; label?: string }[]
}

interface NvInstance {
  attached?: Promise<void> | null
  isNew?: boolean
  uri?: string
  volumes: NvVolume[]
  meshes: unknown[]
  canvas: HTMLCanvasElement | null
  view?: { render: () => void }
  model: { removeVolume: (index: number) => void }
  addVolume: (options: unknown) => Promise<unknown>
  addMesh: (options: unknown) => Promise<unknown>
  setVolume: (index: number, options: Record<string, unknown>) => Promise<unknown>
  setFrame4D: (id: string, frame: number) => void
  updateGLVolume: () => Promise<void>
  drawScene: () => void
  getCrosshairPos: () => number[]
  setCrosshairPos: (mm: [number, number, number]) => void
  mm2frac?: (mm: number[]) => number[]
  frac2vox?: (frac: number[]) => number[]
  createOnLocationChange?: () => void
  addEventListener?: (name: string, fn: (e: { detail?: NvLocation }) => void) => void
  crosshairWidth: number
  isRadiological: boolean
  isColorbarVisible: boolean
}

interface CallMessage {
  id: number
  method: string
  params?: Record<string, unknown>
}

declare global {
  interface Window {
    setup: (htmlComponent: MatlabHTMLComponent) => void
  }
}

let appPropsGlobal: AppProps | null = null
let hostRef: MatlabHTMLComponent | null = null

function emit(name: string, payload: unknown) {
  hostRef?.sendEventToMATLAB('nvevent', { name, payload })
}

function reply(id: number, ok: boolean, value: unknown, error?: string) {
  hostRef?.sendEventToMATLAB('nvresult', { id, ok, value, error: error ?? '' })
}

/** Resolve once the app has a canvas whose GPU pipeline is fully attached. */
function getNv(timeoutMs = 20000): Promise<NvInstance> {
  return new Promise((resolve, reject) => {
    const started = Date.now()
    const tick = () => {
      const nv = appPropsGlobal?.nvArray.value[0]
      // nv.attached is the promise NiiVueCanvas assigns when it *begins*
      // attaching, not a boolean. Treating it as a flag lets a load start
      // against a half-built pipeline, and updateGLVolume then throws
      // "createBindGroup ... Required member is undefined" - intermittently,
      // because it depends on how far attach got first.
      if (nv && nv.attached) {
        Promise.resolve(nv.attached).then(
          () => {
            const inst = nv as unknown as NvInstance
            bindLocation(inst)
            resolve(inst)
          },
          (err: unknown) => reject(err instanceof Error ? err : new Error(String(err))),
        )
        return
      }
      if (Date.now() - started > timeoutMs) {
        reject(new Error('Timed out waiting for the NiiVue canvas to attach'))
        return
      }
      setTimeout(tick, 25)
    }
    tick()
  })
}

async function fetchBytes(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(
      `Could not read ${url} (HTTP ${res.status}). MATLAB only serves an ` +
        `allowlisted set of extensions from the viewer folder; the host writes .bin.`,
    )
  }
  return res.arrayBuffer()
}

function volumeSummary(nv: NvInstance, index: number) {
  const vol = nv.volumes[index]
  if (!vol) {
    throw new Error(`No volume at index ${index + 1}`)
  }
  // Every field is emitted, using null rather than undefined where NiiVue has
  // not filled one in: JSON drops undefined, which would reach MATLAB as a
  // missing struct field and turn "no window set" into an error at the call
  // site.
  const num = (v: unknown) => (typeof v === 'number' && isFinite(v) ? v : null)
  return {
    index: index + 1, // MATLAB is 1-based all the way to the wire
    name: vol.name ?? '',
    dims: Array.from(vol.hdr?.dims ?? []).slice(1, 5),
    pixDims: Array.from(vol.hdr?.pixDims ?? []).slice(1, 5),
    calMin: num(vol.cal_min) ?? num(vol.hdr?.cal_min),
    calMax: num(vol.cal_max) ?? num(vol.hdr?.cal_max),
    colormap: vol.colormap ?? '',
    opacity: num(vol.opacity) ?? 1,
    nFrame4D: num(vol.nFrame4D) ?? 1,
  }
}

let boundNv: NvInstance | null = null
let lastLocation: NvLocation | null = null

/** Attach once per instance so NiiVue's own location payload is available. */
function bindLocation(nv: NvInstance) {
  if (boundNv === nv || typeof nv.addEventListener !== 'function') {
    return
  }
  boundNv = nv
  lastLocation = null
  nv.addEventListener('locationChange', (e) => {
    if (e.detail) {
      lastLocation = e.detail
    }
  })
}

function sameSpot(a: number[], b: number[]) {
  return a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) < 1e-3)
}

// The crosshair position is read straight from the instance, so it is never
// stale. Voxel indices and per-layer intensities come from NiiVue's own
// locationChange payload - recomputing them here drifted - but only when that
// payload describes the position we are actually reporting. With several
// linked panels the events arrive from all of them, so an unchecked cache
// would occasionally answer for the previous spot.
function locationPayload(nv: NvInstance) {
  const mm = Array.from(nv.getCrosshairPos())
  if (lastLocation && sameSpot(Array.from(lastLocation.mm ?? []), mm)) {
    return {
      mm,
      vox: Array.from(lastLocation.vox ?? []),
      values: (lastLocation.values ?? []).map((v) => ({
        name: v.name ?? '',
        value: v.value,
        label: v.label ?? '',
      })),
    }
  }
  return { mm, vox: [], values: [] }
}

/** Force NiiVue to recompute and re-emit, then let the event land. */
async function refreshLocation(nv: NvInstance) {
  if (typeof nv.createOnLocationChange === 'function') {
    nv.createOnLocationChange()
  }
  const mm = Array.from(nv.getCrosshairPos())
  const deadline = Date.now() + 500
  while (Date.now() < deadline) {
    if (lastLocation && sameSpot(Array.from(lastLocation.mm ?? []), mm)) {
      return
    }
    await new Promise((r) => setTimeout(r, 10))
  }
}

const LAYOUTS: Record<string, number> = {
  axial: SLICE_TYPE.AXIAL,
  coronal: SLICE_TYPE.CORONAL,
  sagittal: SLICE_TYPE.SAGITTAL,
  multiplanar: SLICE_TYPE.MULTIPLANAR,
  render: SLICE_TYPE.RENDER,
}

type Params = Record<string, unknown>

const methods: Record<string, (p: Params, nvP: Promise<NvInstance>) => Promise<unknown>> = {
  async loadVolume(p, nvP) {
    const nv = await nvP
    const buf = await fetchBytes(p.url as string)
    // Pass the real filename, not the .bin the host wrote: NiiVue picks its
    // reader from the extension.
    const volName = String(p.name)
    await nv.addVolume({ url: new File([buf], volName), name: volName })
    const index = nv.volumes.length - 1
    const opts: Record<string, unknown> = {}
    if (p.colormap) {
      opts.colormap = p.colormap
    }
    if (typeof p.opacity === 'number') {
      opts.opacity = p.opacity
    }
    if (typeof p.calMin === 'number') {
      opts.cal_min = p.calMin
    }
    if (typeof p.calMax === 'number') {
      opts.cal_max = p.calMax
    }
    if (Object.keys(opts).length) {
      await nv.setVolume(index, opts)
    }
    await nv.updateGLVolume()
    appPropsGlobal!.nvArray.value = [...appPropsGlobal!.nvArray.value]
    emit('volumeLoaded', volumeSummary(nv, index))
    return volumeSummary(nv, index)
  },

  async openTiles(p, nvP) {
    await nvP
    const items = (p.items ?? []) as { url: string; name: string }[]
    const props = appPropsGlobal!

    // Go through the app's own addImage pipeline rather than loading straight
    // into one instance: each addImage claims its own canvas, and Container
    // wires broadcastTo across them, so the tiles come out linked with no
    // extra work here. It also owns the attach-before-load sequencing.
    //
    // Start from an empty array so this call gets exactly as many fresh
    // panels as it has images. Two earlier attempts were worse: asking for
    // one panel per image on top of the existing ones left a stray empty
    // tile, and reusing an already-mounted instance hung, because setting
    // body again on a canvas that has already loaded once does not trigger
    // another load.
    props.nvArray.value = []
    window.postMessage({ type: 'initCanvas', body: { n: items.length } }, '*')

    for (const item of items) {
      const buf = await fetchBytes(item.url)
      window.postMessage({ type: 'addImage', body: { data: buf, uri: item.name } }, '*')
    }

    // Wait until every tile has either a volume or a recorded load error,
    // so the MATLAB call does not return before there is anything to see.
    const deadline = Date.now() + 120000
    for (;;) {
      const arr = props.nvArray.value
      const settled = arr.filter(
        (nv) => (nv.volumes?.length ?? 0) > 0 || (nv as unknown as { loadError?: unknown }).loadError,
      ).length
      if (settled >= items.length) {
        break
      }
      if (Date.now() > deadline) {
        throw new Error(`Only ${settled} of ${items.length} images loaded before the timeout`)
      }
      await new Promise((r) => setTimeout(r, 50))
    }

    const arr = props.nvArray.value
    return {
      tiles: arr.length,
      names: arr.map((nv) => (nv as unknown as { uri?: string }).uri ?? ''),
      failed: arr
        .map((nv, i) => ((nv as unknown as { loadError?: unknown }).loadError ? i + 1 : 0))
        .filter((i) => i > 0),
    }
  },

  async loadMesh(p, nvP) {
    const nv = await nvP
    const buf = await fetchBytes(p.url as string)
    const meshName = String(p.name)
    await nv.addMesh({ url: new File([buf], meshName), name: meshName })
    appPropsGlobal!.nvArray.value = [...appPropsGlobal!.nvArray.value]
    return { index: nv.meshes.length }
  },

  async setVolumeOptions(p, nvP) {
    const nv = await nvP
    const i = (p.index as number) - 1
    const opts: Record<string, unknown> = {}
    if (p.colormap) {
      opts.colormap = p.colormap
    }
    if (typeof p.opacity === 'number') {
      opts.opacity = p.opacity
    }
    if (typeof p.calMin === 'number') {
      opts.cal_min = p.calMin
    }
    if (typeof p.calMax === 'number') {
      opts.cal_max = p.calMax
    }
    await nv.setVolume(i, opts)
    await nv.updateGLVolume()
    appPropsGlobal!.nvArray.value = [...appPropsGlobal!.nvArray.value]
    return volumeSummary(nv, i)
  },

  async removeVolume(p, nvP) {
    const nv = await nvP
    nv.model.removeVolume((p.index as number) - 1)
    // Refreshing GL with an empty stack tears down the bind groups and every
    // later load fails with "createBindGroup ... Required member is undefined".
    if (nv.volumes.length > 0) {
      await nv.updateGLVolume()
    }
    appPropsGlobal!.nvArray.value = [...appPropsGlobal!.nvArray.value]
    return { count: nv.volumes.length }
  },

  async clear(_p, nvP) {
    await nvP
    const props = appPropsGlobal!
    const all = props.nvArray.value as unknown as NvInstance[]
    for (const inst of all) {
      for (let i = inst.volumes.length - 1; i >= 0; i--) {
        inst.model.removeVolume(i)
      }
      // Deliberately no updateGLVolume: with nothing loaded it destroys the
      // bind groups and the next addVolume fails.
      inst.drawScene()
    }
    // Collapse any extra panels openTiles created, so clear really does return
    // the viewer to its opening state rather than leaving empty tiles behind.
    if (props.nvArray.value.length > 1) {
      props.nvArray.value = [props.nvArray.value[0]]
    }
    lastLocation = null
    props.nvArray.value = [...props.nvArray.value]
    return { count: 0 }
  },

  async setCrosshair(p, nvP) {
    const nv = await nvP
    const mm = p.mm as [number, number, number]
    // Set every panel, not just the first. Container has each instance
    // broadcastTo the others, so a position written to one panel can be
    // overwritten moments later by another panel broadcasting its own - which
    // showed up as the crosshair snapping back to the origin, but only
    // sometimes, because it is a race.
    const all = appPropsGlobal!.nvArray.value as unknown as NvInstance[]
    for (const inst of all) {
      inst.setCrosshairPos(mm)
      inst.drawScene()
    }
    await refreshLocation(nv)
    return locationPayload(nv)
  },

  async getCrosshair(_p, nvP) {
    const nv = await nvP
    await refreshLocation(nv)
    return locationPayload(nv)
  },

  async getVolumeInfo(p, nvP) {
    const nv = await nvP
    return volumeSummary(nv, (p.index as number) - 1)
  },

  async count(_p, nvP) {
    const nv = await nvP
    return { volumes: nv.volumes.length, meshes: nv.meshes.length }
  },

  async setLayout(p, nvP) {
    const nv = await nvP
    const key = String(p.layout).toLowerCase()
    if (!(key in LAYOUTS)) {
      throw new Error(`Unknown layout "${p.layout}"`)
    }
    appPropsGlobal!.sliceType.value = LAYOUTS[key]
    nv.drawScene()
    return { layout: key }
  },

  async setOptions(p, nvP) {
    const nv = await nvP
    if (typeof p.crosshairVisible === 'boolean') {
      nv.crosshairWidth = p.crosshairVisible ? 1 : 0
    }
    if (typeof p.radiological === 'boolean') {
      nv.isRadiological = p.radiological
    }
    if (typeof p.colorbar === 'boolean') {
      nv.isColorbarVisible = p.colorbar
    }
    nv.drawScene()
    return {}
  },

  async setFrame(p, nvP) {
    const nv = await nvP
    const i = (p.index as number) - 1
    const id = nv.volumes[i]?.id
    if (!id) {
      throw new Error(`Volume ${p.index} cannot be scrubbed: it has no id`)
    }
    nv.setFrame4D(id, (p.frame as number) - 1)
    return { frame: p.frame }
  },

  async snapshot(_p, nvP) {
    await nvP
    const instances = (appPropsGlobal!.nvArray.value as unknown as NvInstance[]).filter(
      (nv) => nv.canvas,
    )
    if (instances.length === 0) {
      throw new Error('No canvas attached yet')
    }

    // Composite every panel in its on-screen position, so a tiled
    // comparison captures as the grid the user is looking at rather than
    // just the first tile.
    const rects = instances.map((nv) => nv.canvas!.getBoundingClientRect())
    const left = Math.min(...rects.map((r) => r.left))
    const top = Math.min(...rects.map((r) => r.top))
    const right = Math.max(...rects.map((r) => r.right))
    const bottom = Math.max(...rects.map((r) => r.bottom))
    const scale = window.devicePixelRatio || 1

    const out = document.createElement('canvas')
    out.width = Math.max(1, Math.round((right - left) * scale))
    out.height = Math.max(1, Math.round((bottom - top) * scale))
    const ctx = out.getContext('2d')
    if (!ctx) {
      throw new Error('Could not create a 2-D context for the capture')
    }

    instances.forEach((nv, i) => {
      // Render and blit one panel at a time. The WebGL2 context is created
      // without preserveDrawingBuffer, so a buffer is only readable in the
      // same task as its draw - rendering all of them first and compositing
      // afterwards would capture blanks.
      nv.drawScene()
      if (nv.view && typeof nv.view.render === 'function') {
        nv.view.render()
      }
      const r = rects[i]
      ctx.drawImage(
        nv.canvas!,
        Math.round((r.left - left) * scale),
        Math.round((r.top - top) * scale),
        Math.round(r.width * scale),
        Math.round(r.height * scale),
      )
    })

    const url = out.toDataURL('image/png')
    return {
      png: url.slice(url.indexOf(',') + 1),
      panels: instances.length,
      width: out.width,
      height: out.height,
    }
  },
}

async function dispatch(msg: CallMessage) {
  const { id, method, params } = msg
  const fn = methods[method]
  if (!fn) {
    reply(id, false, null, `Unknown method "${method}"`)
    return
  }
  try {
    const value = await fn(params ?? {}, getNv())
    reply(id, true, value)
  } catch (err) {
    reply(id, false, null, err instanceof Error ? err.message : String(err))
  }
}

window.setup = (htmlComponent: MatlabHTMLComponent) => {
  hostRef = htmlComponent
  htmlComponent.addEventListener('nvcall', (event: MatlabEvent) => {
    void dispatch(event.Data as CallMessage)
  })
  // The app mounts one canvas up front so the first call has somewhere to land.
  window.postMessage({ type: 'initCanvas', body: { n: 1 } }, '*')
  emit('ready', { href: location.href })
}

function MatlabApp() {
  const [isReady, setIsReady] = useState(false)
  const appProps = useAppState({
    showCrosshairs: true,
    interpolation: true,
    colorbar: false,
    radiologicalConvention: false,
    zoomDragMode: false,
    defaultVolumeColormap: 'gray',
    defaultOverlayColormap: 'redyell',
    defaultOverlayOpacity: 0.5,
    defaultMeshOverlayColormap: 'hsv',
  })

  // One-time wiring. listenToMessages adds a window 'message' listener with no
  // de-dup, so re-running would process each message N times. The signals in
  // appProps are stable for the component's lifetime, so an empty dep array is
  // correct even though appProps's identity changes per render.
  useEffect(() => {
    appPropsGlobal = appProps
    listenToMessages(appProps)
    setIsReady(true)
  }, [])

  // Forward crosshair movement. Volume.tsx updates `location` whenever NiiVue's
  // locationChange fires, which covers clicks, drags and programmatic moves.
  const locationValue = appProps.location.value
  useEffect(() => {
    if (!locationValue) {
      return
    }
    const nv = appProps.nvArray.value[0]
    if (!nv) {
      return
    }
    emit('crosshairMoved', locationPayload(nv as unknown as NvInstance))
  }, [locationValue])

  if (!isReady) {
    return <div>Initializing NiiVue...</div>
  }

  return <App appProps={appProps} />
}

const app = document.getElementById('app')
if (app) {
  render(<MatlabApp />, app)
}
