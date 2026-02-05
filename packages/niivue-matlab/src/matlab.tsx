import { render } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { App, useAppState } from '@niivue/react'
import { Niivue, SLICE_TYPE } from '@niivue/niivue'
import './matlab.css'

// Global state for communication with MATLAB
let appPropsGlobal: any = null
let htmlComponentRef: any = null

// MATLAB bridge setup function - called by MATLAB's uihtml component
declare global {
  interface Window {
    setup: (htmlComponent: any) => void
  }
}

window.setup = (htmlComponent: any) => {
  htmlComponentRef = htmlComponent

  // Listen for DataChanged event from MATLAB
  htmlComponent.addEventListener('DataChanged', (event: any) => {
    const data = htmlComponent.Data
    if (data && appPropsGlobal) {
      handleMatlabMessage(data, appPropsGlobal)
    }
  })

  // Notify MATLAB that the viewer is ready
  sendToMatlab({ type: 'viewerReady' })
}

// Handle messages from MATLAB
function handleMatlabMessage(data: any, appProps: any) {
  const { type, payload } = data
  const { nvArray } = appProps

  switch (type) {
    case 'loadVolume':
      loadVolumeFromBase64(payload, appProps)
      break
    case 'setOpacity':
      if (nvArray.value.length > 0 && nvArray.value[0].volumes.length > payload.index) {
        nvArray.value[0].volumes[payload.index].opacity = payload.opacity
        nvArray.value[0].updateGLVolume()
        nvArray.value = [...nvArray.value]
      }
      break
    case 'setColormap':
      if (nvArray.value.length > 0 && nvArray.value[0].volumes.length > payload.index) {
        nvArray.value[0].volumes[payload.index].colormap = payload.colormap
        nvArray.value[0].updateGLVolume()
        nvArray.value = [...nvArray.value]
      }
      break
    case 'updateCrosshairs':
      if (nvArray.value.length > 0) {
        nvArray.value[0].scene.crosshairPos = [payload.x, payload.y, payload.z]
        nvArray.value[0].drawScene()
        nvArray.value = [...nvArray.value]
      }
      break
    case 'addMesh':
      loadMeshFromBase64(payload, appProps)
      break
    case 'setSliceType':
      appProps.sliceType.value = payload.sliceType || SLICE_TYPE.MULTIPLANAR
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
async function loadVolumeFromBase64(payload: any, appProps: any) {
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
      const name = payload.name || 'volume.nii'

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
async function loadMeshFromBase64(payload: any, appProps: any) {
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
      const name = payload.name || 'mesh.obj'

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
function sendToMatlab(data: any) {
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
  const appProps = useAppState({})

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
