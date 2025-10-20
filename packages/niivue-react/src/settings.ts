export interface NiiVueSettings {
  showCrosshairs: boolean
  interpolation: boolean
  colorbar: boolean
  radiologicalConvention: boolean
  zoomDragMode: boolean
  defaultVolumeColormap: string
  defaultOverlayColormap: string
  defaultMeshOverlayColormap: string
}

export const defaultSettings: NiiVueSettings = {
  showCrosshairs: true,
  interpolation: true,
  colorbar: false,
  radiologicalConvention: false,
  zoomDragMode: false,
  defaultVolumeColormap: 'gray',
  defaultOverlayColormap: 'redyell',
  defaultMeshOverlayColormap: 'hsv',
}
