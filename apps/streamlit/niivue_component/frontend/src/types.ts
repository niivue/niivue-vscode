import { SLICE_TYPE } from '@niivue/niivue'

export interface MeshOverlay {
  data: string // base64 encoded overlay data
  name: string
  colormap?: string
  opacity?: number
}

export interface MeshData {
  data: string // base64 encoded mesh data
  name: string
  overlays?: MeshOverlay[]
}

export interface StreamlitArgs {
  nifti_data?: string // base64 encoded main image
  filename?: string
  overlays?: Array<{
    data: string // base64 encoded overlay
    name: string
    colormap?: string
    opacity?: number
  }>
  meshes?: MeshData[]
  height?: number
  view_mode?: 'axial' | 'coronal' | 'sagittal' | '3d' | 'multiplanar'
  styled?: boolean // true for StyledViewer (with menu), false for UnstyledCanvas
  settings?: {
    crosshair?: boolean
    radiological?: boolean
    colorbar?: boolean
    interpolation?: boolean
  }
  // Throttle interval (ms) for click/drag events sent back to Python.
  // null disables feedback entirely — no setComponentValue calls, no Python
  // round-trips on mouse interaction.
  update_interval_ms?: number | null
}

export interface ClickEventData {
  type: 'voxel_click'
  voxel: [number, number, number]
  mm: [number, number, number]
  value: number
  filename: string
}

export const VIEW_MODE_TO_SLICE_TYPE: Record<string, number> = {
  axial: SLICE_TYPE.AXIAL,
  coronal: SLICE_TYPE.CORONAL,
  sagittal: SLICE_TYPE.SAGITTAL,
  '3d': SLICE_TYPE.RENDER,
  multiplanar: SLICE_TYPE.MULTIPLANAR,
}
