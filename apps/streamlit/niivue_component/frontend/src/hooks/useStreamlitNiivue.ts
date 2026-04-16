import { Niivue } from '@niivue/niivue'
import { handleMessage, initCanvas, isImageType, useAppState } from '@niivue/react'
import { useEffect, useRef } from 'preact/hooks'
import { Streamlit } from 'streamlit-component-lib'
import { StreamlitArgs, VIEW_MODE_TO_SLICE_TYPE } from '../types'
import { base64ToArrayBuffer, throttle } from '../utils'

/** Sample characters from a base64 string for fingerprinting (avoids hashing overhead) */
function dataFingerprint(data: string | undefined): string {
  if (!data) return '0'
  const len = data.length
  const mid = Math.floor(len / 2)
  return `${len}:${data.slice(0, 8)}${data.slice(mid, mid + 8)}${data.slice(-8)}`
}

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
    defaultOverlayOpacity: 0.5,
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
  const loadedMeshesRef = useRef<string | null>(null)
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

  // Compute a stable ID for the mesh list using data fingerprints (for change detection)
  const meshId = args.meshes
    ? JSON.stringify(args.meshes.map(m => `${m.name}-${dataFingerprint(m.data)}`))
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
    loadedMeshesRef.current = null // Reset loaded meshes
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

  // Load additional meshes after base is loaded (volume + meshes mode, or extra meshes in mesh-only mode)
  useEffect(() => {
    const nv = appProps.nvArray.value[0]
    if (!nv || !nv.isLoaded || !args.meshes || args.meshes.length === 0) {
      return
    }

    // Skip if meshes haven't changed
    if (meshId === loadedMeshesRef.current) {
      return
    }

    // Clear previously loaded additional meshes
    const keepCount = args.nifti_data ? 0 : 1
    while (nv.meshes.length > keepCount) {
      nv.removeMesh(nv.meshes[nv.meshes.length - 1])
    }

    // In mesh-only mode, first mesh is already loaded as base
    const startIndex = args.nifti_data ? 0 : 1

    for (let i = startIndex; i < args.meshes.length; i++) {
      const meshEntry = args.meshes[i]
      handleMessage({
        type: 'overlay',
        body: {
          data: base64ToArrayBuffer(meshEntry.data),
          uri: meshEntry.name,
          index: 0,
        },
      }, appProps)
    }
    loadedMeshesRef.current = meshId
    loadedMeshOverlaysRef.current = [] // Reset mesh overlays when meshes change
  }, [appProps.nvArray.value, appProps.nvArray.value[0]?.isLoaded, meshId])

  // Load mesh overlays (only from the first mesh, since niivue targets meshes[0])
  useEffect(() => {
    const nv = appProps.nvArray.value[0]
    if (!nv || !nv.isLoaded || !args.meshes || args.meshes.length === 0) {
      return
    }

    // Check if meshes are loaded
    if (nv.meshes.length === 0) {
      return
    }

    // Only the first mesh supports overlays (niivue-react applies overlays to meshes[0])
    const firstMesh = args.meshes[0]
    const meshOverlays = firstMesh.overlays || []

    if (meshOverlays.length === 0) {
      return
    }

    const overlayIds = meshOverlays.map(o =>
      `${o.name}-${o.colormap}-${o.opacity}-${dataFingerprint(o.data)}`
    )

    if (JSON.stringify(overlayIds) !== JSON.stringify(loadedMeshOverlaysRef.current)) {
      // Clear existing mesh layers before re-adding to prevent accumulation
      const baseMesh = nv.meshes[0]
      if (baseMesh.layers && baseMesh.layers.length > 0) {
        baseMesh.layers = []
        baseMesh.updateMesh(nv.gl)
        nv.updateGLVolume()
      }

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
      loadedMeshOverlaysRef.current = overlayIds
    }
  }, [appProps.nvArray.value, appProps.nvArray.value[0]?.isLoaded, args.meshes])

  // Throttled wrapper for Streamlit.setComponentValue to avoid overwhelming
  // Python with updates during mouse drag. update_interval_ms === null
  // disables feedback entirely: no handler attached, no Streamlit round-trips.
  const feedbackDisabled = args.update_interval_ms === null
  const intervalMs = typeof args.update_interval_ms === 'number' ? args.update_interval_ms : 100
  const throttledSetValue = useRef<ReturnType<typeof throttle<(data: { type: string; voxel: number[]; mm: number[]; value: number; filename: string }) => void>> | null>(null)
  const throttleIntervalRef = useRef<number | null>(null)
  // (Re)build the throttle on mount, on interval change, and after a toggle
  // from disabled → enabled. The previous instance is cancelled first to
  // avoid a stale trailing call firing with the old interval.
  if (!feedbackDisabled && throttleIntervalRef.current !== intervalMs) {
    throttledSetValue.current?.cancel()
    throttledSetValue.current = throttle((data: { type: string; voxel: number[]; mm: number[]; value: number; filename: string }) => {
      Streamlit.setComponentValue(data)
    }, intervalMs)
    throttleIntervalRef.current = intervalMs
  }
  if (feedbackDisabled && throttledSetValue.current) {
    throttledSetValue.current.cancel()
    throttledSetValue.current = null
    throttleIntervalRef.current = null
  }

  // Sync click events back to Streamlit
  useEffect(() => {
    if (feedbackDisabled) {
      return
    }

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
  }, [appProps.nvArray.value, args.filename, feedbackDisabled, intervalMs])

  // Set frame height
  useEffect(() => {
    Streamlit.setFrameHeight(args.height || 600)
  }, [args.height])

  return appProps
}
