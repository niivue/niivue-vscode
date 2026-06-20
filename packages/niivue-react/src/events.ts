import NiiVue, { DRAG_MODE, SLICE_TYPE } from '@niivue/niivue'
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
        const name = body.name || 'document.nvd'
        nv.uri = name
        nv.isNew = false
        // v1: nv.loadDocument takes a File. The message carries the .nvd CBOR
        // bytes (Uint8Array); wrap them in a File for NiiVueCanvas to load once
        // the canvas/GL is attached.
        nv.documentData = new File([body.document], name)
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
          body: [nvArray.value[0].volumes[0].calMin, nvArray.value[0].volumes[0].calMax],
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
  calMin?: number
  calMax?: number
}

async function addMeshOverlay(nv: NiiVue, item: any, type: string, settings: NiiVueSettings) {
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
  // v1: load the layer through the controller (meshIndex 0 here - uses nv.meshes[0]).
  // addMeshLayer parses the buffer, appends the layer, and updates the mesh
  // internally, so the manual readLayer/push/updateMesh dance is gone. The old
  // `useNegativeCmap` flag is expressed by a non-empty `colormapNegative`.
  await nv.addMeshLayer(0, {
    url: new File([item.data], item.uri),
    name: item.uri,
    opacity: a.opacity,
    colormap: a.colormap,
    colormapNegative: a.colormapNegative,
    calMin: a.calMin,
    calMax: a.calMax,
  })

  nv.isColorbarVisible = true
  await nv.updateGLVolume()
  const layerNumber = nv.meshes[0].layers.length - 1
  if (type === 'addMeshCurvature') {
    await nv.setMeshLayerProperty(0, layerNumber, { isColorbarVisible: false })
  }
}

function getLayerDefaults(type: string, settings: NiiVueSettings) {
  const a: LayerOptions = {}
  switch (type) {
    case 'addMeshCurvature':
      {
        a.opacity = 0.7
        a.colormap = 'gray'
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
      }
      break
  }
  return a
}

async function addOverlay(nv: NiiVue, item: any, settings: NiiVueSettings) {
  if (isImageType(item.uri)) {
    const overlayColormap = item.colormap || settings?.defaultOverlayColormap || 'redyell'
    const overlayOpacity = item.opacity ?? settings?.defaultOverlayOpacity ?? 0.5
    // v1: addVolume takes the load options directly. `url` is string | File.
    // No data (empty string / undefined) means load from the URL (item.uri); a
    // non-empty string is itself a URL/path; in-memory bytes wrap in a File.
    const url = !item.data
      ? item.uri
      : typeof item.data === 'string'
        ? item.data
        : new File([toBlobPart(item.data)], item.uri)
    await nv.addVolume({
      url,
      name: item.uri,
      colormap: overlayColormap,
      opacity: overlayOpacity,
    })
  } else {
    const url = item.data ? new File([toBlobPart(item.data)], item.uri) : item.uri
    await nv.addMesh({ url, name: item.uri })
  }
}

// niivue's File/Blob wrapping needs a real BlobPart. ArrayBuffers and TypedArray
// views pass through; a plain number[] (some postMessage bridges serialize
// buffers this way) is repacked into a Uint8Array.
function toBlobPart(data: ArrayBuffer | ArrayBufferView | number[]): BlobPart {
  if (Array.isArray(data)) return new Uint8Array(data)
  return data as BlobPart
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

export class ExtendedNiivue extends NiiVue {
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
  documentData: File | null = null // pending .nvd import (CBOR bytes wrapped in a File), consumed by NiiVueCanvas
  onVolumeUpdated = () => { }
  onFrameUpdate = (frame: number) => { }
  // v1: cross-canvas pan/3D sync is handled natively by `nv.broadcastTo(targets)`
  // (Container.tsx/syncVolumes wires it), so the old per-canvas mouse-move sync
  // override is gone. The 4D `setFrame4D` override is gone too: NiiVueCanvas
  // listens to the native `'frameChange'` event and forwards it to `onFrameUpdate`,
  // which fires for every frame change (internal or caller-driven), not just ours.
}

function growNvArrayBy(nvArray: Signal<NiiVue[]>, n: number) {
  for (let i = 0; i < n; i++) {
    const nv = new ExtendedNiivue({
      // v1 made crosshair its own drag mode and the default for the primary
      // (left) button. Mapping the old `contrast` value here suppressed it, so
      // left-click/drag no longer moved the crosshair (regression vs 0.x). Keep
      // crosshair on the left button; windowing stays on the right button via
      // niivue's default secondaryDragMode.
      primaryDragMode: DRAG_MODE.crosshair,
      isDragDropEnabled: false, // handled by app (Volume component)
      // 'c' (cycle clip plane) and 'v' (cycle view mode) are handled by the
      // app's useKeyboardShortcuts hook, which broadcasts to every selected
      // canvas. v1.0 removed the built-in clip-plane / view-mode hotkey options
      // (no built-in hotkeys remain), so niivue no longer double-acts on the
      // focused canvas - the app is the single source of truth. See
      // niivue/niivue-vscode#224.
    })
    nv.key = Math.random()
    nvArray.value = [...nvArray.value, nv]
  }
}
