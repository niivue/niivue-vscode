import { render } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { App, listenToMessages, useAppState } from '@niivue/react'
import type { AppProps } from '@niivue/react'
import { NVMesh, SLICE_TYPE } from '@niivue/niivue'
import './matlab.css'

// MATLAB's uihtml component calls window.setup(htmlComponent) once the HTML
// is loaded. We use that as the only inbound channel: htmlComponent.Data is a
// JSON-serialisable struct that MATLAB writes, and DataChanged fires here.
// We write back to htmlComponent.Data to ship messages to MATLAB.
interface MatlabHTMLComponent {
  Data: unknown
  addEventListener: (event: string, handler: (event: Event) => void) => void
}

interface MatlabMessage {
  type: string
  payload?: {
    data?: string
    name?: string
    colormap?: string
    opacity?: number
    index?: number
    x?: number
    y?: number
    z?: number
    sliceType?: number
  }
}

declare global {
  interface Window {
    setup: (htmlComponent: MatlabHTMLComponent) => void
  }
}

let appPropsGlobal: AppProps | null = null
let htmlComponentRef: MatlabHTMLComponent | null = null

window.setup = (htmlComponent: MatlabHTMLComponent) => {
  htmlComponentRef = htmlComponent

  htmlComponent.addEventListener('DataChanged', (_event: Event) => {
    const data = htmlComponent.Data as MatlabMessage
    if (data && appPropsGlobal) {
      handleMatlabMessage(data, appPropsGlobal)
    }
  })

  sendToMatlab({ type: 'viewerReady' })
}

function sendToMatlab(data: object) {
  if (!htmlComponentRef) {
    return
  }
  try {
    htmlComponentRef.Data = data
  } catch (error) {
    console.error('Error sending data to MATLAB:', error)
  }
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

// After a postMessage(addImage/addOverlay), the React app loads the volume
// asynchronously via NiiVueCanvas's effect on nv.body. Optional MATLAB-side
// args (colormap, opacity) need to land *after* that completes. Poll the
// nvArray briefly until the new volume shows up, then apply.
function applyVolumeOptionsWhenReady(
  appProps: AppProps,
  before: number,
  options: { colormap?: string; opacity?: number },
  attempts = 50,
): void {
  const nv = appProps.nvArray.value[0]
  const grew = nv && nv.volumes.length > before
  if (!grew) {
    if (attempts > 0) {
      setTimeout(() => applyVolumeOptionsWhenReady(appProps, before, options, attempts - 1), 100)
    }
    return
  }
  const idx = nv.volumes.length - 1
  if (options.colormap) {
    nv.volumes[idx].colormap = options.colormap
  }
  if (typeof options.opacity === 'number') {
    nv.volumes[idx].opacity = options.opacity
  }
  nv.updateGLVolume()
  appProps.nvArray.value = [...appProps.nvArray.value]
}

function handleMatlabMessage(data: MatlabMessage, appProps: AppProps) {
  const { type, payload } = data
  const { nvArray } = appProps

  if (!payload) {
    return
  }

  switch (type) {
    case 'loadVolume': {
      if (!payload.data) {
        return
      }
      const buffer = base64ToArrayBuffer(payload.data)
      const uri = payload.name ?? 'volume.nii'
      const existingNv = nvArray.value[0]
      const volumesBefore = existingNv ? existingNv.volumes.length : 0

      if (nvArray.value.length === 0) {
        // First volume: spin up a single canvas and load into it. The
        // addImage handler in events.ts → NiiVueCanvas.loadVolume accepts
        // raw ArrayBuffers for NIfTI/NRRD/MGH directly.
        window.postMessage({ type: 'initCanvas', body: { n: 1 } }, '*')
        window.postMessage({ type: 'addImage', body: { data: buffer, uri } }, '*')
      } else {
        // Subsequent volumes layer onto the existing canvas as overlays.
        // The 'overlay' handler in events.ts goes through NVImage.loadFromUrl,
        // whose url field is typed as string, so wrap the buffer in a Blob
        // URL to stay on the well-typed path.
        const blobUrl = URL.createObjectURL(new Blob([buffer]))
        window.postMessage({ type: 'overlay', body: { data: blobUrl, uri, index: 0 } }, '*')
      }

      if (payload.colormap || typeof payload.opacity === 'number') {
        applyVolumeOptionsWhenReady(appProps, volumesBefore, {
          colormap: payload.colormap,
          opacity: payload.opacity,
        })
      }
      break
    }
    case 'addMesh': {
      if (!payload.data || nvArray.value.length === 0) {
        sendToMatlab({
          type: 'error',
          message: 'Load a volume before adding a mesh',
        })
        return
      }
      const nv = nvArray.value[0]
      const buffer = base64ToArrayBuffer(payload.data)
      const name = payload.name ?? 'mesh.obj'
      NVMesh.readMesh(buffer, name, nv.gl)
        .then((mesh) => {
          nv.addMesh(mesh)
          nvArray.value = [...nvArray.value]
        })
        .catch((error) => {
          console.error('Error loading mesh:', error)
          sendToMatlab({ type: 'error', message: `Failed to load mesh: ${error}` })
        })
      break
    }
    case 'setColormap':
      if (
        typeof payload.index === 'number' &&
        typeof payload.colormap === 'string' &&
        nvArray.value.length > 0 &&
        nvArray.value[0].volumes.length > payload.index
      ) {
        nvArray.value[0].volumes[payload.index].colormap = payload.colormap
        nvArray.value[0].updateGLVolume()
        nvArray.value = [...nvArray.value]
      }
      break
    case 'setOpacity':
      if (
        typeof payload.index === 'number' &&
        typeof payload.opacity === 'number' &&
        nvArray.value.length > 0 &&
        nvArray.value[0].volumes.length > payload.index
      ) {
        nvArray.value[0].volumes[payload.index].opacity = payload.opacity
        nvArray.value[0].updateGLVolume()
        nvArray.value = [...nvArray.value]
      }
      break
    case 'updateCrosshairs':
      if (
        typeof payload.x === 'number' &&
        typeof payload.y === 'number' &&
        typeof payload.z === 'number' &&
        nvArray.value.length > 0
      ) {
        nvArray.value[0].scene.crosshairPos = [payload.x, payload.y, payload.z]
        nvArray.value[0].drawScene()
      }
      break
    case 'setSliceType':
      appProps.sliceType.value = payload.sliceType ?? SLICE_TYPE.MULTIPLANAR
      break
    case 'clearVolumes':
      if (nvArray.value.length > 0) {
        nvArray.value[0].volumes = []
        nvArray.value[0].updateGLVolume()
        nvArray.value = [...nvArray.value]
      }
      break
    default:
      console.warn('Unknown message type from MATLAB:', type)
  }
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

  // One-time wiring on mount. listenToMessages registers a window 'message'
  // listener with no de-dup, so re-running this effect would accumulate
  // handlers and process each MATLAB-driven postMessage N times. The signals
  // inside appProps are stable across re-renders (useSignal returns the same
  // instance per component lifetime), so an empty dep array is correct here
  // even though appProps's object identity changes per render.
  useEffect(() => {
    appPropsGlobal = appProps
    listenToMessages(appProps)
    setIsReady(true)
  }, [])

  // Forward crosshair changes back to MATLAB. The React app's `location`
  // signal is updated by Volume.tsx whenever niivue's onLocationChange fires
  // (mouse click, drag, programmatic move). Watching it via a useEffect dep
  // avoids both the 100 ms polling loop and the onLocationChange-overwrite
  // collision that broke direct nv.onLocationChange assignment from here.
  // Reading `.value` in the dep array also serves as the preact-signals
  // subscription anchor; useSignals/preset-vite wires the rerender on
  // change.
  const locationValue = appProps.location.value
  useEffect(() => {
    if (!locationValue) {
      return
    }
    const nv = appProps.nvArray.value[0]
    if (!nv?.scene?.crosshairPos) {
      return
    }
    sendToMatlab({
      type: 'crosshairUpdate',
      position: Array.from(nv.scene.crosshairPos) as [number, number, number],
    })
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
