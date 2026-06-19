import { Niivue, NVImage, NVMesh, NVMeshLoaders, SLICE_TYPE, type DocumentData } from '@niivue/niivue'
import { Signal } from '@preact/signals'
import { AppProps } from './components/AppProps'
import { isNvdFile, readNvdFile } from './document'
import { readyStateManager } from './readyState'
import { NiiVueSettings } from './settings'
import { buildImageMessageBodies, isImageType } from './utility'

/**
 * Increments a global counter used by E2E tests to know when an image or
 * overlay has finished loading. Both NiiVueCanvas (addImage path) and the
 * overlay message handlers (overlay / addMeshOverlay paths) call this so that
 * `waitForImageLoad` in tests works for all load types.
 */
export function notifyImageLoaded() {
  const w = window as any
  w.__niivue = w.__niivue || {}
  w.__niivue.loadedCount = (w.__niivue.loadedCount ?? 0) + 1
}

export async function handleMessage(message: any, appProps: AppProps) {
  const { nvArray, sliceType, settings } = appProps
  const { type, body } = message

  switch (type) {
    case 'addMeshOverlay':
    case 'addMeshCurvature':
    case 'replaceMeshOverlay':
      {
        await addMeshOverlay(nvArray.value[body.index], body, type, settings.value)
        notifyImageLoaded()
      }
      break
    case 'overlay':
      {
        const index = body.index >= 0 ? body.index : nvArray.value.length - 1
        if (index >= 0 && index < nvArray.value.length) {
          await addOverlay(nvArray.value[index], body, settings.value)
          notifyImageLoaded()
        }
      }
      break
    case 'addImage':
      {
        const nv = getUnitinializedNvInstance(nvArray)
        nv.uri = body.uri
        nv.isNew = false
        if (body.loadError) {
          // Surface the error in the existing on-canvas error overlay
          // (Volume.tsx) instead of attempting a doomed load.
          nv.loadError = body.loadError
          notifyImageLoaded()
        } else {
          nv.body = body
        }
      }
      break
    case 'loadDocument':
      {
        // Import a niivue scene document (.nvd) into a fresh canvas. The actual
        // nv.loadDocument call is deferred to NiiVueCanvas, which fires once the
        // canvas (and its GL context) is attached - mirroring the addImage path.
        const nv = getUnitinializedNvInstance(nvArray)
        nv.uri = body.name || 'document.nvd'
        nv.isNew = false
        nv.documentData = body.document
      }
      break
    case 'initCanvas':
      {
        initCanvas(appProps, body.n)
      }
      break
    case 'debugRequest':
      {
        handleDebugMessage(body, appProps)
      }
      break
    default:
      return false // Message not handled
  }

  nvArray.value = [...nvArray.value] // triggers rerender after each received message
  return true // Message was handled
}

export function listenToMessages(appProps: AppProps) {
  const { nvArray, sliceType, settings } = appProps
  window.addEventListener('message', (e: any) => {
    handleMessage(e.data, appProps)
  })
  readyStateManager.setEventListenerReady()
  addImageFromURLParams()
}

function handleDebugMessage(body: any, appProps: AppProps) {
  // sending arrays is fine, dataBuffer does not work
  // sending objects only works with one element inside
  const { nvArray } = appProps
  switch (body) {
    case 'getNCanvas':
      {
        window.postMessage({
          type: 'debugAnswer',
          body: nvArray.value.length,
        })
      }
      break
    case 'getMinMaxOfFirstImage':
      {
        window.postMessage({
          type: 'debugAnswer',
          body: [nvArray.value[0].volumes[0].cal_min, nvArray.value[0].volumes[0].cal_max],
        })
      }
      break
    case 'getNVolumes':
      {
        window.postMessage({
          type: 'debugAnswer',
          body: nvArray.value[0].volumes.length,
        })
      }
      break
    case 'getSliceType':
      {
        window.postMessage({
          type: 'debugAnswer',
          body: appProps.sliceType.value,
        })
      }
      break
    case 'getInterpolation':
      {
        window.postMessage({
          type: 'debugAnswer',
          body: appProps.settings.value.interpolation,
        })
      }
      break
  }
}

export function openImageFromURL(uri: string) {
  window.postMessage({
    type: 'addImage',
    body: {
      data: '',
      uri,
    },
  })
}

export function addImageFromURLParams() {
  const urlParams = new URLSearchParams(window.location.search)
  const imageURLs = urlParams.get('images')?.split(',') ?? []
  if (imageURLs.length === 0) {
    return
  }
  window.postMessage({
    type: 'initCanvas',
    body: { n: imageURLs.length },
  })
  imageURLs.forEach(async (url) => {
    try {
      const data = await (await fetch(url)).arrayBuffer()
      const body: Record<string, unknown> = { data, uri: url }
      if (url.toLowerCase().endsWith('.mhd')) {
        const text = new TextDecoder().decode(data)
        const match = text.match(/^ElementDataFile\s*=\s*(.+)$/im)
        const rawValue = match?.[1].trim().replace(/^["']|["']$/g, '') ?? ''
        if (rawValue && rawValue.toUpperCase() !== 'LOCAL') {
          const basename = rawValue.replace(/\\/g, '/').split('/').pop()
          if (basename) {
            const rawUrl = url.replace(/[^/]+$/, basename)
            try {
              const resp = await fetch(rawUrl)
              if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
              body.pairedData = await resp.arrayBuffer()
            } catch (err) {
              console.warn(`Failed to fetch paired MHD raw file ${rawUrl}:`, err)
              body.loadError = `Missing paired data file "${basename}" at ${rawUrl}. MHD is a detached format and requires its referenced voxel file.`
            }
          }
        }
      }
      window.postMessage({ type: 'addImage', body })
    } catch (err) {
      console.error(`Failed to load image from URL ${url}:`, err)
    }
  })
}

interface LayerOptions {
  opacity?: number
  colormap?: string
  colormapNegative?: string
  useNegativeCmap?: boolean
  calMin?: number
  calMax?: number
}

async function addMeshOverlay(nv: Niivue, item: any, type: string, settings: NiiVueSettings) {
  if (nv.meshes.length === 0) {
    return
  }

  const a = getLayerDefaults(type, settings)
  const mesh = nv.meshes[0]
  if (type === 'replaceMeshOverlay') {
    mesh.layers.pop()
  }
  if (!item.data) {
    const response = await fetch(item.uri)
    if (!response.ok) {
      throw new Error(`Load mesh overlay error! status: ${response.status}`)
    }
    item.data = await response.arrayBuffer()
  }
  const newLayer = await NVMeshLoaders.readLayer(
    item.uri,
    item.data,
    mesh,
    a.opacity,
    a.colormap,
    a.colormapNegative,
    a.useNegativeCmap,
    a.calMin,
    a.calMax,
  )

  if (newLayer) {
    // Set the name property on the layer
    newLayer.name = item.uri
    nv.meshes[0].layers.push(newLayer)
  } else {
    throw Error('Layer could not be loaded')
  }

  mesh.updateMesh(nv.gl)
  nv.opts.isColorbar = true
  nv.updateGLVolume()
  const layerNumber = nv.meshes[0].layers.length - 1
  if (type === 'addMeshCurvature') {
    nv.setMeshLayerProperty(nv.meshes[0].id as any, layerNumber, 'colorbarVisible', false as any)
  }
}

function getLayerDefaults(type: string, settings: NiiVueSettings) {
  const a: LayerOptions = {}
  switch (type) {
    case 'addMeshCurvature':
      {
        a.opacity = 0.7
        a.colormap = 'gray'
        a.useNegativeCmap = false
        a.calMin = 0.3
        a.calMax = 0.5
      }
      break
    case 'addMeshOverlay':
    case 'replaceMeshOverlay':
      {
        a.opacity = 0.7
        a.colormap = settings?.defaultMeshOverlayColormap || 'hsv'
        a.colormapNegative = ''
        a.useNegativeCmap = false
      }
      break
  }
  return a
}

async function addOverlay(nv: Niivue, item: any, settings: NiiVueSettings) {
  if (isImageType(item.uri)) {
    const overlayColormap = item.colormap || settings?.defaultOverlayColormap || 'redyell'
    const overlayOpacity = item.opacity ?? settings?.defaultOverlayOpacity ?? 0.5
    const image = await NVImage.loadFromUrl({
      url: item.data || item.uri,
      name: item.uri,
      colormap: overlayColormap,
      opacity: overlayOpacity,
    })
    nv.addVolume(image)
    const idx = nv.volumes.length - 1
    if (idx >= 0) {
      nv.volumes[idx].colormap = overlayColormap
      nv.setOpacity(idx, overlayOpacity)
      nv.updateGLVolume()
    }
  } else {
    const mesh = await NVMesh.readMesh(item.data, item.uri, nv.gl, 0.5)
    nv.addMesh(mesh)
  }
}

export function addOverlayEvent(imageIndex: number, type: string) {
  if (typeof vscode === 'object') {
    vscode.postMessage({
      type: 'addOverlay',
      body: { type, index: imageIndex },
    })
  } else {
    const input = document.createElement('input')
    input.type = 'file'

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement)?.files?.[0]
      if (file) {
        file.arrayBuffer().then((data) => {
          window.postMessage({
            type,
            body: {
              data,
              uri: file.name,
              index: imageIndex,
            },
          })
        })
      }
    }
    input.click()
  }
}

export function addImagesEvent() {
  if (typeof vscode === 'object') {
    vscode.postMessage({ type: 'addImages' })
  } else {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    // input.accept = imageFileTypes;

    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement)?.files ?? [])
      if (files.length === 0) return
      // Scene documents (.nvd) load a whole scene; route them to the document
      // importer and let the rest flow through the image pipeline.
      for (const file of files.filter((f) => isNvdFile(f.name))) {
        try {
          const document = await readNvdFile(file)
          window.postMessage({ type: 'loadDocument', body: { document, name: file.name } })
        } catch (err) {
          console.error(`Failed to read .nvd file ${file.name}:`, err)
        }
      }
      const imageFiles = files.filter((f) => !isNvdFile(f.name))
      if (imageFiles.length === 0) return
      const bodies = await buildImageMessageBodies(imageFiles)
      if (bodies.length === 0) return
      window.postMessage({
        type: 'initCanvas',
        body: { n: bodies.length },
      })
      for (const body of bodies) {
        window.postMessage({ type: 'addImage', body })
      }
    }
    input.click()
  }
}

/**
 * Open a file picker for a NiiVue scene document (.nvd) and import it into a
 * fresh canvas via the `loadDocument` message. This is the browser-host
 * counterpart to `saveScene`'s download; vscode hosts persist scenes through
 * their own services, so the menu gates this to non-vscode.
 */
export function loadDocumentEvent() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.nvd'

  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement)?.files?.[0]
    if (!file) return
    try {
      const document = await readNvdFile(file)
      window.postMessage({ type: 'loadDocument', body: { document, name: file.name } })
    } catch (err) {
      console.error(`Failed to read .nvd file ${file.name}:`, err)
    }
  }

  input.click()
}

export function addDcmFolderEvent() {
  if (typeof vscode === 'object') {
    vscode.postMessage({ type: 'addDcmFolder' })
  } else {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = false
    input.webkitdirectory = true

    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files ?? [])
      const data = await Promise.all(files.map((file) => file.arrayBuffer()))
      window.postMessage({
        type: 'addImage',
        body: {
          data: data,
          uri: files.map((file) => file.name),
        },
      })
    }

    input.click()
  }
}

export function initCanvas(props: AppProps, n = 1) {
  const { nvArray, sliceType } = props
  if (nvArray.value.length === 0 && n > 1) {
    sliceType.value = SLICE_TYPE.AXIAL
  }
  growNvArrayBy(nvArray, n)
}

function getUnitinializedNvInstance(nvArray: Signal<ExtendedNiivue[]>) {
  const nv = nvArray.value.find((nv) => nv.isNew)
  if (nv) {
    return nv
  }
  growNvArrayBy(nvArray, 1)
  return nvArray.value[nvArray.value.length - 1]
}

export class ExtendedNiivue extends Niivue {
  constructor(opts: any) {
    super(opts)
  }
  isNew = true
  isLoaded = false
  isLoading = false // Prevent duplicate loadVolume calls during re-renders
  loadError = ''
  uri = ''
  key = NaN
  body = null
  documentData: DocumentData | null = null // pending .nvd import, consumed by NiiVueCanvas
  onVolumeUpdated = () => { }
  onFrameUpdate = (frame: number) => { }
  setFrame4D(volumeOrId: any, frame: number) {
    super.setFrame4D(volumeOrId, frame)
    if (this.volumes[0]) {
      this.onFrameUpdate(this.volumes[0].frame4D)
    }
  }
  mouseMoveListener(e: MouseEvent) {
    super.mouseMoveListener(e)
    if (this.uiData.mouseButtonRightDown || this.uiData.mouseButtonCenterDown) {
      this.canvas?.focus()
      // handle the case where this.otherNV is of type Niivue
      if (this.otherNV != null) {
        if (this.otherNV instanceof Niivue) {
          this.otherNV.scene.pan2Dxyzmm = this.scene.pan2Dxyzmm
          this.otherNV.drawScene()
        } else {
          this.otherNV.forEach((nv: Niivue) => {
            nv.scene.pan2Dxyzmm = this.scene.pan2Dxyzmm
            nv.drawScene()
          })
        }
      }
    }
  }
}

function growNvArrayBy(nvArray: Signal<Niivue[]>, n: number) {
  for (let i = 0; i < n; i++) {
    const nv = new ExtendedNiivue({
      isResizeCanvas: true,
      dragMode: 1, // contrast
      dragAndDropEnabled: false, // handled by app (Volume component)
      // 'c' (cycle clip plane) and 'v' (cycle view mode) are handled by the
      // app's useKeyboardShortcuts hook, which broadcasts to every selected
      // canvas. Disabling NiiVue's own canvas-level handlers for these keys
      // (an empty hotkey never matches an event's KeyboardEvent.code) keeps the
      // app as the single source of truth, so the focused canvas is no longer
      // acted on a second time on key release. See niivue/niivue-vscode#224.
      clipPlaneHotKey: '',
      viewModeHotKey: '',
    })
    nv.key = Math.random()
    nvArray.value = [...nvArray.value, nv]
  }
}
