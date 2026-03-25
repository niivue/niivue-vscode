import { Niivue } from '@niivue/niivue'
import { handleMessage, initCanvas, isImageType, useAppState } from '@niivue/react'
import { useEffect, useRef } from 'preact/hooks'
import { Streamlit } from 'streamlit-component-lib'
import { MeshData, StreamlitArgs, VIEW_MODE_TO_SLICE_TYPE } from '../types'
import { base64ToArrayBuffer, throttle } from '../utils'

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
  const prevMeshRef = useRef<string | null>(null)
  const loadedOverlaysRef = useRef<string[]>([])
  const loadedMeshOverlaysRef = useRef<string[]>([])

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

  // Compute a stable ID for the mesh list (for change detection)
  const meshId = args.meshes
    ? JSON.stringify(args.meshes.map(m => `${m.name}-${m.data?.length || 0}`))
    : null

  // Load base image or first mesh via the standard message system
  useEffect(() => {
    const hasVolume = args.nifti_data && args.nifti_data !== prevDataRef.current
    const hasMeshOnly = !args.nifti_data && args.meshes && args.meshes.length > 0 && meshId !== prevMeshRef.current

    if (!hasVolume && !hasMeshOnly) {
      return
    }

    prevDataRef.current = args.nifti_data || null
    prevMeshRef.current = meshId
    loadedOverlaysRef.current = [] // Reset overlays when base changes
    loadedMeshOverlaysRef.current = [] // Reset mesh overlays

    // Initialize canvas for 1 base image
    initCanvas(appProps, 1)

    if (args.nifti_data) {
      // Load volume as base image
      handleMessage({
        type: 'addImage',
        body: {
          data: base64ToArrayBuffer(args.nifti_data),
          uri: args.filename || 'image.nii',
        },
      }, appProps)
    } else if (args.meshes && args.meshes.length > 0) {
      // Load first mesh as base image (mesh-only mode)
      const firstMesh = args.meshes[0]
      handleMessage({
        type: 'addImage',
        body: {
          data: base64ToArrayBuffer(firstMesh.data),
          uri: firstMesh.name,
        },
      }, appProps)
    }
  }, [args.nifti_data, meshId])

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

  // Load meshes after base volume is loaded (volume + meshes mode)
  // In mesh-only mode, the first mesh is loaded as base, additional meshes loaded here
  useEffect(() => {
    const nv = appProps.nvArray.value[0]
    if (!nv || !nv.isLoaded || !args.meshes || args.meshes.length === 0) {
      return
    }

    // In mesh-only mode, first mesh is already loaded as base
    const startIndex = args.nifti_data ? 0 : 1

    for (let i = startIndex; i < args.meshes.length; i++) {
      const mesh = args.meshes[i]
      handleMessage({
        type: 'overlay',
        body: {
          data: base64ToArrayBuffer(mesh.data),
          uri: mesh.name,
          index: 0,
        },
      }, appProps)
    }
  }, [appProps.nvArray.value, appProps.nvArray.value[0]?.isLoaded, args.meshes])

  // Load mesh overlays after meshes are loaded
  useEffect(() => {
    const nv = appProps.nvArray.value[0]
    if (!nv || !nv.isLoaded || !args.meshes || args.meshes.length === 0) {
      return
    }

    // Check if meshes are loaded
    if (nv.meshes.length === 0) {
      return
    }

    // Collect all mesh overlays for change detection
    const allMeshOverlayIds: string[] = []
    const meshOverlays: { data: string; name: string; colormap?: string; opacity?: number }[] = []

    for (const mesh of args.meshes) {
      if (mesh.overlays) {
        for (const overlay of mesh.overlays) {
          allMeshOverlayIds.push(`${overlay.name}-${overlay.colormap}-${overlay.opacity}-${overlay.data?.length || 0}`)
          meshOverlays.push(overlay)
        }
      }
    }

    if (meshOverlays.length === 0) {
      return
    }

    if (JSON.stringify(allMeshOverlayIds) !== JSON.stringify(loadedMeshOverlaysRef.current)) {
      for (const overlay of meshOverlays) {
        handleMessage({
          type: 'addMeshOverlay',
          body: {
            data: base64ToArrayBuffer(overlay.data),
            uri: overlay.name,
            colormap: overlay.colormap || 'redyell',
            opacity: overlay.opacity ?? 0.7,
            index: 0,
          },
        }, appProps)
      }
      loadedMeshOverlaysRef.current = allMeshOverlayIds
    }
  }, [appProps.nvArray.value, appProps.nvArray.value[0]?.isLoaded, args.meshes])

  // Throttled wrapper for Streamlit.setComponentValue to avoid overwhelming
  // Python with updates during mouse drag (fires at most once per 100ms)
  const throttledSetValue = useRef<ReturnType<typeof throttle<(data: { type: string; voxel: number[]; mm: number[]; value: number; filename: string }) => void>> | null>(null)
  if (!throttledSetValue.current) {
    throttledSetValue.current = throttle((data: { type: string; voxel: number[]; mm: number[]; value: number; filename: string }) => {
      Streamlit.setComponentValue(data)
    }, 100)
  }

  // Sync click events back to Streamlit
  useEffect(() => {
    const handleLocationChange = (data: any) => {
      if (appProps.nvArray.value.length > 0 && appProps.nvArray.value[0]?.isLoaded) {
        const voxel = data.vox
        const mm = data.mm
        const value = data.values[0]?.value ?? 0

        throttledSetValue.current?.({
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
      throttledSetValue.current?.cancel()
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
