import { Container, useAppState } from '@niivue/react'
import { Niivue } from '@niivue/niivue'
import { Streamlit } from 'streamlit-component-lib'
import { useEffect } from 'preact/hooks'
import { StreamlitArgs, VIEW_MODE_TO_SLICE_TYPE } from '../types'
import { loadImageData } from '../utils'

interface UnstyledCanvasProps {
  args: StreamlitArgs
}

export const UnstyledCanvas = ({ args }: UnstyledCanvasProps) => {
  const appProps = useAppState({
    showCrosshairs: args.settings?.crosshair ?? true,
    radiologicalConvention: args.settings?.radiological ?? false,
    colorbar: args.settings?.colorbar ?? false,
    interpolation: args.settings?.interpolation ?? true,
    defaultVolumeColormap: 'gray',
    zoomDragMode: 'both',
    defaultOverlayColormap: 'red',
    defaultMeshOverlayColormap: 'redyell',
  } as any)

  const { sliceType, settings } = appProps

  // Set view mode
  useEffect(() => {
    if (args.view_mode) {
      sliceType.value = VIEW_MODE_TO_SLICE_TYPE[args.view_mode] ?? VIEW_MODE_TO_SLICE_TYPE.axial
    }
  }, [args.view_mode])

  // Update settings when args change
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

  // Load images when data changes
  useEffect(() => {
    loadImageData(args, appProps)
  }, [args.nifti_data, args.overlays])

  // Setup click event handler
  useEffect(() => {
    const handleLocationChange = () => {
      if (appProps.nvArray.value.length > 0 && appProps.nvArray.value[0]?.isLoaded) {
        const nv = appProps.nvArray.value[0] as any
        const mm = nv.scene.crosshairPos
        const voxel = nv.mm2vox(mm)
        const value =
          nv.volumes[0]?.getValue(
            Math.round(voxel[0]),
            Math.round(voxel[1]),
            Math.round(voxel[2]),
          ) ?? 0

        Streamlit.setComponentValue({
          type: 'voxel_click',
          voxel: [Math.round(voxel[0]), Math.round(voxel[1]), Math.round(voxel[2])],
          mm: [mm[0], mm[1], mm[2]],
          value: value,
          filename: args.filename || '',
        })
      }
    }

    // Attach event listeners to all niivue instances
    appProps.nvArray.value.forEach((nv: Niivue) => {
      if (nv.canvas) {
        ;(nv as any).onLocationChange = handleLocationChange
      }
    })

    return () => {
      appProps.nvArray.value.forEach((nv: Niivue) => {
        if (nv.canvas) {
          ;(nv as any).onLocationChange = null
        }
      })
    }
  }, [appProps.nvArray.value, args.filename])

  // Set frame height
  useEffect(() => {
    Streamlit.setFrameHeight(args.height || 600)
  }, [args.height])

  return (
    <div className="w-full h-full bg-gray-900">
      <Container {...appProps} />
    </div>
  )
}
