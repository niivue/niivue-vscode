import { handleMessage, initCanvas, isImageType, useAppState } from '@niivue/react'
import { useEffect, useRef } from 'preact/hooks'
import { Streamlit } from 'streamlit-component-lib'
import { LoadEventType, LoadTracker } from '../loadEvents'
import { LoadEventData, MeshData, MeshOverlay, StreamlitArgs, VIEW_MODE_TO_SLICE_TYPE } from '../types'
import { base64ToArrayBuffer, buildVoxelClickPayload, throttle } from '../utils'

/** Sample characters from a base64 string for fingerprinting (avoids hashing overhead) */
function dataFingerprint(data: string | undefined): string {
  if (!data) return '0'
  const len = data.length
  const mid = Math.floor(len / 2)
  return `${len}:${data.slice(0, 8)}${data.slice(mid, mid + 8)}${data.slice(-8)}`
}

// Change-detection IDs for what the arguments ask to load.
const volumeOverlayIds = (overlays: NonNullable<StreamlitArgs['overlays']>) =>
  overlays.map(o => `${o.name}-${o.colormap}-${o.opacity}-${o.data?.length || 0}`)

const meshListId = (meshes: MeshData[] | undefined) =>
  meshes ? JSON.stringify(meshes.map(m => `${m.name}-${dataFingerprint(m.data)}`)) : null

const meshOverlayIds = (overlays: MeshOverlay[]) =>
  overlays.map(o => `${o.name}-${o.colormap}-${o.opacity}-${dataFingerprint(o.data)}`)

const sameIds = (a: string[], b: string[]) => JSON.stringify(a) === JSON.stringify(b)

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

  // Load events (load_events=True): report when the base image, and then every
  // overlay and mesh requested with it, has finished loading. Promise callbacks
  // read the latest arguments through argsRef.
  const argsRef = useRef(args)
  argsRef.current = args
  const baseNvRef = useRef<(typeof appProps.nvArray.value)[number] | null>(null)
  const baseFilenameRef = useRef('')
  const trackerRef = useRef<LoadTracker | null>(null)
  if (!trackerRef.current) {
    trackerRef.current = new LoadTracker(
      () => {
        const { overlays, meshes } = argsRef.current
        const meshOverlays = meshes?.[0]?.overlays ?? []
        // Mesh overlays wait for a mesh to apply them to; if every mesh failed there is none.
        const hasMesh = (appProps.nvArray.value[0]?.meshes.length ?? 0) > 0
        return {
          baseLoaded: baseNvRef.current?.isLoaded === true,
          baseFailed: !!baseNvRef.current?.loadError,
          allStarted:
            (!overlays?.length || sameIds(volumeOverlayIds(overlays), loadedOverlaysRef.current)) &&
            (!meshes?.length || meshListId(meshes) === loadedMeshesRef.current) &&
            (!meshOverlays.length ||
              !hasMesh ||
              sameIds(meshOverlayIds(meshOverlays), loadedMeshOverlaysRef.current)),
        }
      },
      (type: LoadEventType) => {
        if (argsRef.current.load_events === true) {
          const event: LoadEventData = {
            type,
            filename: baseFilenameRef.current,
            timestamp: Date.now(),
          }
          if (type === 'load_error') {
            event.error = baseNvRef.current?.loadError || ''
          }
          Streamlit.setComponentValue(event)
        }
      },
    )
  }
  const tracker = trackerRef.current
  useEffect(() => () => tracker.dispose(), [])

  // The viewer posts its own actions (NVDocument > Load, dropped files) to this
  // window. Only those are handled; Streamlit talks to the component through
  // messages from the parent page.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source === window) {
        handleMessage(event.data, appProps)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  // Sync view mode (axial, coronal, etc)
  useEffect(() => {
    if (args.view_mode) {
      sliceType.value = VIEW_MODE_TO_SLICE_TYPE[args.view_mode] ?? VIEW_MODE_TO_SLICE_TYPE.axial
    }
  }, [args.view_mode])

  // Sync settings (crosshairs, radiological, etc). Streamlit always hands us
  // a fresh args.settings object identity on every re-run, so depending on
  // it directly would re-fire setInterpolation/setCrosshairWidth/drawScene
  // in NiiVueCanvas (the dominant GL-side cost during bidirectional drag).
  // Depend on a content fingerprint instead so the effect only runs when a
  // user-controllable field actually changed.
  const settingsKey = args.settings
    ? `${args.settings.crosshair}|${args.settings.radiological}|${args.settings.colorbar}|${args.settings.interpolation}`
    : ''
  useEffect(() => {
    if (!args.settings) return
    settings.value = {
      ...settings.value,
      showCrosshairs: args.settings.crosshair ?? settings.value.showCrosshairs,
      radiologicalConvention: args.settings.radiological ?? settings.value.radiologicalConvention,
      colorbar: args.settings.colorbar ?? settings.value.colorbar,
      interpolation: args.settings.interpolation ?? settings.value.interpolation,
    }
  }, [settingsKey])

  // Compute a stable ID for the mesh list using data fingerprints (for change detection)
  const meshId = meshListId(args.meshes)

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
    // addImage fills the first instance that has no image yet, as found here.
    baseNvRef.current = appProps.nvArray.value.find((nv) => nv.isNew) ?? null
    baseFilenameRef.current = args.filename || ''
    tracker.baseStarted()

    if (args.nifti_data) {
      // Load volume as base image
      const filename = args.filename || 'image.nii'
      const body: Record<string, unknown> = {
        data: base64ToArrayBuffer(args.nifti_data),
        uri: filename,
      }
      if (args.paired_data) {
        body.pairedData = base64ToArrayBuffer(args.paired_data)
      } else if (filename.toLowerCase().endsWith('.mhd')) {
        body.loadError =
          `MHD is a detached format. Pass the referenced voxel file ` +
          `(e.g. .raw) via the paired_data argument: ` +
          `niivue_viewer(nifti_data=mhd_bytes, paired_data=raw_bytes, filename="${filename}")`
      }
      handleMessage({ type: 'addImage', body }, appProps)
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
    const overlayIds = volumeOverlayIds(args.overlays)
    const currentIds = loadedOverlaysRef.current
    
    // If overlay list changed, clear and reload all overlays
    if (!sameIds(overlayIds, currentIds)) {
      // Remove all overlays except base volume (index 0). v1: removal is a
      // synchronous model op (index-based); refresh the GPU once after.
      while (nv.volumes.length > 1) {
        nv.model.removeVolume(nv.volumes.length - 1)
      }
      nv.updateGLVolume()
      
      // Load all overlays sequentially
      for (const overlay of args.overlays) {
        tracker.track(handleMessage({
          type: 'overlay',
          body: {
            data: base64ToArrayBuffer(overlay.data),
            uri: (overlay.name && isImageType(overlay.name)) ? overlay.name : `${overlay.name || 'overlay'}.nii.gz`,
            colormap: overlay.colormap || 'red',
            opacity: overlay.opacity ?? 0.5,
            index: 0,
          },
        }, appProps))
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

    // Clear previously loaded additional meshes. v1: removal is a synchronous
    // model op (index-based); refresh the GPU once after.
    const keepCount = args.nifti_data ? 0 : 1
    while (nv.meshes.length > keepCount) {
      nv.model.removeMesh(nv.meshes.length - 1)
    }
    nv.updateGLVolume()

    // In mesh-only mode, first mesh is already loaded as base
    const startIndex = args.nifti_data ? 0 : 1

    for (let i = startIndex; i < args.meshes.length; i++) {
      const meshEntry = args.meshes[i]
      tracker.track(handleMessage({
        type: 'overlay',
        body: {
          data: base64ToArrayBuffer(meshEntry.data),
          uri: meshEntry.name,
          index: 0,
        },
      }, appProps))
    }
    loadedMeshesRef.current = meshId
    loadedMeshOverlaysRef.current = [] // Reset mesh overlays when meshes change
  }, [appProps.nvArray.value, appProps.nvArray.value[0]?.isLoaded, meshId])

  // Load mesh overlays (only from the first mesh, since NiiVue targets meshes[0])
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

    const overlayIds = meshOverlayIds(meshOverlays)

    if (!sameIds(overlayIds, loadedMeshOverlaysRef.current)) {
      // Clear existing mesh layers before re-adding to prevent accumulation.
      // v1: go through removeMeshLayer so the mesh colors recomposite (mutating
      // mesh.layers directly would leave the previous overlay colors baked in).
      const baseMesh = nv.meshes[0]
      while (baseMesh.layers && baseMesh.layers.length > 0) {
        nv.removeMeshLayer(0, baseMesh.layers.length - 1)
      }

      for (const overlay of meshOverlays) {
        tracker.track(handleMessage({
          type: 'addMeshOverlay',
          body: {
            data: base64ToArrayBuffer(overlay.data),
            uri: overlay.name,
            colormap: overlay.colormap || 'redyell',
            opacity: overlay.opacity ?? 0.7,
            index: 0,
          },
        }, appProps))
      }
      loadedMeshOverlaysRef.current = overlayIds
    }
  }, [appProps.nvArray.value, appProps.nvArray.value[0]?.isLoaded, args.meshes])

  // After the load effects above, so the loads they start in this render are
  // already tracked. nvArray is reassigned when the base image and each
  // overlay or mesh finish loading.
  useEffect(() => {
    tracker.check()
  }, [appProps.nvArray.value])

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

    const handleLocationChange = (detail: any) => {
      if (appProps.nvArray.value.length > 0 && appProps.nvArray.value[0]?.isLoaded) {
        throttledSetValue.current?.(buildVoxelClickPayload(detail, args.filename))
      }
    }

    // v1: location updates arrive on the 'locationChange' DOM event (the
    // settable nv.onLocationChange callback was removed). Attach to every
    // instance and clean up with the same listener reference.
    const onLoc = (e: CustomEvent) => handleLocationChange(e.detail)
    appProps.nvArray.value.forEach((nv) => {
      if (nv.canvas) {
        nv.addEventListener('locationChange', onLoc)
      }
    })

    return () => {
      throttledSetValue.current?.cancel()
      appProps.nvArray.value.forEach((nv) => {
        if (nv.canvas) {
          nv.removeEventListener('locationChange', onLoc)
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
