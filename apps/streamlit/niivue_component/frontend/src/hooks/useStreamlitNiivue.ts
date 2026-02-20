import { Niivue } from '@niivue/niivue'
import { handleMessage, initCanvas, isImageType, useAppState } from '@niivue/react'
import { useEffect, useRef } from 'preact/hooks'
import { Streamlit } from 'streamlit-component-lib'
import { StreamlitArgs, VIEW_MODE_TO_SLICE_TYPE } from '../types'
import { base64ToArrayBuffer } from '../utils'

/** Shared hook for Streamlit NiiVue components */
export const useStreamlitNiivue = (args: StreamlitArgs) => {
  const appProps = useAppState({
    showCrosshairs: args.settings?.crosshair ?? true,
    radiologicalConvention: args.settings?.radiological ?? false,
    colorbar: args.settings?.colorbar ?? false,
    interpolation: args.settings?.interpolation ?? true,
    defaultVolumeColormap: 'gray',
    zoomDragMode: false,
    defaultOverlayColormap: 'red',
    defaultMeshOverlayColormap: 'redyell',
    menuItems: {
      home: false,
      addImage: false,
      view: true,
      zoom: true,
      colorScale: true,
      overlay: false,
      header: true,
    },
  })

  const { sliceType, settings } = appProps
  const prevDataRef = useRef<string | null>(null)
  const loadedOverlaysRef = useRef<string[]>([])

  // Sync view mode (axial, coronal, etc)
  useEffect(() => {
    if (args.view_mode) {
      sliceType.value = VIEW_MODE_TO_SLICE_TYPE[args.view_mode] ?? VIEW_MODE_TO_SLICE_TYPE.axial
    }
  }, [args.view_mode])

  // Sync settings (crosshairs, radiological, etc)
  useEffect(() => {
    if (args.settings) {
      settings.value = {
        ...settings.value,
        showCrosshairs: args.settings.crosshair ?? settings.value.showCrosshairs,
        radiologicalConvention: args.settings.radiological ?? settings.value.radiologicalConvention,
        colorbar: args.settings.colorbar ?? settings.value.colorbar,
        interpolation: args.settings.interpolation ?? settings.value.interpolation,
      }
    }
  }, [args.settings])

  // Load base image via the standard message system
  useEffect(() => {
    if (!args.nifti_data || args.nifti_data === prevDataRef.current) {
      return
    }
    prevDataRef.current = args.nifti_data
    loadedOverlaysRef.current = [] // Reset overlays when base image changes

    // Initialize canvas for 1 base image
    initCanvas(appProps, 1)

    // Load base image
    handleMessage({
      type: 'addImage',
      body: {
        data: base64ToArrayBuffer(args.nifti_data),
        uri: args.filename || 'image.nii',
      },
    }, appProps)
  }, [args.nifti_data])

  // Load overlays after base image is loaded
  useEffect(() => {
    const nv = appProps.nvArray.value[0]
    if (!nv || !nv.isLoaded || !args.overlays || args.overlays.length === 0) {
      return
    }

    // Include data length in overlay ID for change detection
    const overlayIds = args.overlays.map(o => `${o.name}-${o.colormap}-${o.opacity}-${o.data?.length || 0}`)
    const currentIds = loadedOverlaysRef.current
    
    // If overlay list changed, clear and reload all overlays
    if (JSON.stringify(overlayIds) !== JSON.stringify(currentIds)) {
      // Remove all overlays except base volume (index 0)
      while (nv.volumes.length > 1) {
        nv.removeVolume(nv.volumes[nv.volumes.length - 1])
      }
      
      // Load all overlays sequentially
      for (const overlay of args.overlays) {
        handleMessage({
          type: 'overlay',
          body: {
            data: base64ToArrayBuffer(overlay.data),
            uri: (overlay.name && isImageType(overlay.name)) ? overlay.name : `${overlay.name || 'overlay'}.nii.gz`,
            colormap: overlay.colormap || 'red',
            opacity: overlay.opacity ?? 0.5,
            index: 0,
          },
        }, appProps)
      }
      loadedOverlaysRef.current = overlayIds
    }
  }, [appProps.nvArray.value, appProps.nvArray.value[0]?.isLoaded, args.overlays])

  // Sync click events back to Streamlit
  useEffect(() => {
    const handleLocationChange = (data: any) => {
      if (appProps.nvArray.value.length > 0 && appProps.nvArray.value[0]?.isLoaded) {
        const voxel = data.vox
        const mm = data.mm
        const value = data.values[0]?.value ?? 0

        Streamlit.setComponentValue({
          type: 'voxel_click',
          voxel: [Math.round(voxel[0]), Math.round(voxel[1]), Math.round(voxel[2])],
          mm: [mm[0], mm[1], mm[2]],
          value: value,
          filename: args.filename || '',
        })
      }
    }

    // Attach to all niivue instances
    appProps.nvArray.value.forEach((nv: Niivue) => {
      if (nv.canvas) {
        ; (nv as any).onLocationChange = handleLocationChange
      }
    })

    return () => {
      appProps.nvArray.value.forEach((nv: Niivue) => {
        if (nv.canvas) {
          ; (nv as any).onLocationChange = null
        }
      })
    }
  }, [appProps.nvArray.value, args.filename])

  // Set frame height
  useEffect(() => {
    Streamlit.setFrameHeight(args.height || 600)
  }, [args.height])

  return appProps
}
