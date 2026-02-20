export interface MenuItems {
  home: boolean
  addImage: boolean
  view: boolean
  zoom: boolean
  colorScale: boolean
  overlay: boolean
  header: boolean
}

export interface NiiVueSettings {
  showCrosshairs: boolean
  interpolation: boolean
  colorbar: boolean
  radiologicalConvention: boolean
  zoomDragMode: boolean
  defaultVolumeColormap: string
  defaultOverlayColormap: string
  defaultMeshOverlayColormap: string
  menuItems?: MenuItems
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
  menuItems: {
    home: true,
    addImage: true,
    view: true,
    zoom: true,
    colorScale: true,
    overlay: true,
    header: true,
  },
}
