import { NVImage } from '@niivue/niivue'
import { AppProps } from '@niivue/react'
import { StreamlitArgs } from './types'

export async function loadImageData(args: StreamlitArgs, appProps: AppProps) {
  const { nvArray, settings } = appProps

  if (!args.nifti_data) {
    return
  }

  try {
    // Decode base64 data
    const binary_string = window.atob(args.nifti_data)
    const len = binary_string.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i)
    }
    const niftiArrayBuffer = bytes.buffer

    // Create or get the niivue instance
    let nv = nvArray.value[0]
    if (!nv || !nv.gl) {
      // Need to wait for canvas to be ready
      setTimeout(() => loadImageData(args, appProps), 100)
      return
    }

    // Clear existing volumes
    while (nv.volumes.length > 0) {
      nv.removeVolumeByIndex(0)
    }

    // Load main volume
    const volume = await NVImage.loadFromUrl({
      url: niftiArrayBuffer,
      name: args.filename || 'image.nii',
      colormap: settings.value.defaultVolumeColormap || 'gray',
    })
    nv.addVolume(volume)

    // Load overlays if present
    if (args.overlays && args.overlays.length > 0) {
      for (const overlay of args.overlays) {
        const overlay_binary = window.atob(overlay.data)
        const overlay_len = overlay_binary.length
        const overlay_bytes = new Uint8Array(overlay_len)
        for (let i = 0; i < overlay_len; i++) {
          overlay_bytes[i] = overlay_binary.charCodeAt(i)
        }
        const overlayArrayBuffer = overlay_bytes.buffer

        const overlayVolume = await NVImage.loadFromUrl({
          url: overlayArrayBuffer,
          name: overlay.name,
          colormap: overlay.colormap || 'red',
          opacity: overlay.opacity ?? 0.5,
        })
        nv.addVolume(overlayVolume)
      }
    }

    // Update the array to trigger re-render
    nvArray.value = [...nvArray.value]
  } catch (error) {
    console.error('Error loading image data:', error)
  }
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary_string = window.atob(base64)
  const len = binary_string.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i)
  }
  return bytes.buffer
}
