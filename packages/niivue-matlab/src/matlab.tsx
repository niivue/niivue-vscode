import { render } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { App, useAppState } from '@niivue/react'
import type { AppProps } from '@niivue/react'
import { Niivue, SLICE_TYPE } from '@niivue/niivue'
import './matlab.css'

// Global state for communication with MATLAB
let appPropsGlobal: AppProps | null = null
let htmlComponentRef: MatlabHTMLComponent | null = null

// MATLAB HTML component interface
interface MatlabHTMLComponent {
  Data: unknown
  addEventListener: (event: string, handler: (event: Event) => void) => void
}

// MATLAB message types
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

// MATLAB bridge setup function - called by MATLAB's uihtml component
declare global {
  interface Window {
    setup: (htmlComponent: MatlabHTMLComponent) => void
  }
}

window.setup = (htmlComponent: MatlabHTMLComponent) => {
  htmlComponentRef = htmlComponent

  // Listen for DataChanged event from MATLAB
  htmlComponent.addEventListener('DataChanged', (_event: Event) => {
    const data = htmlComponent.Data as MatlabMessage
    if (data && appPropsGlobal) {
      handleMatlabMessage(data, appPropsGlobal)
    }
  })

  // Notify MATLAB that the viewer is ready
  sendToMatlab({ type: 'viewerReady' })
}

// Handle messages from MATLAB
function handleMatlabMessage(data: MatlabMessage, appProps: AppProps) {
  const { type, payload } = data
  const { nvArray } = appProps

  if (!payload) {
    return
  }

  switch (type) {
    case 'loadVolume':
      loadVolumeFromBase64(payload, appProps)
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
    case 'updateCrosshairs':
      if (
        typeof payload.x === 'number' &&
        typeof payload.y === 'number' &&
        typeof payload.z === 'number' &&
        nvArray.value.length > 0
      ) {
        nvArray.value[0].scene.crosshairPos = [payload.x, payload.y, payload.z]
        nvArray.value[0].drawScene()
        nvArray.value = [...nvArray.value]
      }
      break
    case 'addMesh':
      loadMeshFromBase64(payload, appProps)
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

// Load volume from Base64 encoded data
async function loadVolumeFromBase64(payload: MatlabMessage['payload'], appProps: AppProps) {
  if (!payload || !payload.data) {
    return
  }

  const { nvArray } = appProps

  // Initialize canvas if needed
  if (nvArray.value.length === 0) {
    const container = document.getElementById('niivue-canvas-0')
    if (container) {
      const nv = new Niivue()
      nvArray.value = [nv]
      nv.attachToCanvas(container as HTMLCanvasElement)
    }
  }

  if (nvArray.value.length > 0) {
    try {
      // Decode Base64 to ArrayBuffer
      const base64Data = payload.data
      const binaryString = atob(base64Data)
      const len = binaryString.length
      const bytes = new Uint8Array(len)
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      const nv = nvArray.value[0]
      const name = payload.name ?? 'volume.nii'

      // Load the volume
      await nv.loadFromArrayBuffer(bytes.buffer, name)

      // Apply optional parameters
      if (payload.colormap) {
        nv.volumes[nv.volumes.length - 1].colormap = payload.colormap
      }
      if (payload.opacity !== undefined) {
        nv.volumes[nv.volumes.length - 1].opacity = payload.opacity
      }

      nvArray.value = [...nvArray.value]

      // Send crosshair position back to MATLAB
      sendToMatlab({
        type: 'crosshairUpdate',
        position: nv.scene.crosshairPos,
      })
    } catch (error) {
      console.error('Error loading volume:', error)
      sendToMatlab({
        type: 'error',
        message: `Failed to load volume: ${error}`,
      })
    }
  }
}

// Load mesh from Base64 encoded data
async function loadMeshFromBase64(payload: MatlabMessage['payload'], appProps: AppProps) {
  if (!payload || !payload.data) {
    return
  }

  const { nvArray } = appProps

  if (nvArray.value.length > 0) {
    try {
      // Decode Base64 to ArrayBuffer
      const base64Data = payload.data
      const binaryString = atob(base64Data)
      const len = binaryString.length
      const bytes = new Uint8Array(len)
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      const nv = nvArray.value[0]
      const name = payload.name ?? 'mesh.obj'

      await nv.loadMeshFromBuffer(bytes.buffer, name)
      nvArray.value = [...nvArray.value]
    } catch (error) {
      console.error('Error loading mesh:', error)
      sendToMatlab({
        type: 'error',
        message: `Failed to load mesh: ${error}`,
      })
    }
  }
}

// Send message to MATLAB
function sendToMatlab(data: { type: string; position?: number[]; message?: string }) {
  if (htmlComponentRef) {
    try {
      htmlComponentRef.Data = data
    } catch (error) {
      console.error('Error sending data to MATLAB:', error)
    }
  }
}

// Main App component with MATLAB integration
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
    defaultMeshOverlayColormap: 'hsv',
  })

  useEffect(() => {
    appPropsGlobal = appProps
    setIsReady(true)

    // Listen for crosshair changes in the NiiVue instance
    const interval = setInterval(() => {
      if (appProps.nvArray.value.length > 0) {
        const nv = appProps.nvArray.value[0]
        if (nv.scene && nv.scene.crosshairPos) {
          sendToMatlab({
            type: 'crosshairUpdate',
            position: nv.scene.crosshairPos,
          })
        }
      }
    }, 100) // Update every 100ms

    return () => clearInterval(interval)
  }, [appProps])

  if (!isReady) {
    return <div>Initializing NiiVue...</div>
  }

  return <App appProps={appProps} />
}

// Render the app
const app = document.getElementById('app')
if (app) {
  render(<MatlabApp />, app)
}
