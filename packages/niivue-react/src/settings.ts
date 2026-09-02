export interface MenuItems {
  /** Gates the brand "viewer" dropdown (Reset Viewer / About). Named `home`
   *  for back-compat: it formerly toggled the standalone Home button, whose
   *  Reset action now lives in the brand menu. */
  home: boolean
  addImage: boolean
  view: boolean
  zoom: boolean
  colorScale: boolean
  overlay: boolean
  header: boolean
  navigation?: boolean
  saveScene?: boolean
}

export interface NiiVueSettings {
  showCrosshairs: boolean
  interpolation: boolean
  colorbar: boolean
  radiologicalConvention: boolean
  zoomDragMode: boolean
  /** Render 2D slices in scanner/world mm space instead of on the native voxel
   *  grid. Off by default: an oblique acquisition is then shown as the
   *  rectangular grid it was measured on, unrotated and unresampled. */
  worldSpace: boolean
  defaultVolumeColormap: string
  defaultOverlayColormap: string
  defaultOverlayOpacity: number
  defaultMeshOverlayColormap: string
  /** Gap in pixels between canvas tiles in the grid layout. Optional so host
   *  apps can omit it; reads fall back to DEFAULT_TILE_SPACING. */
  tileSpacing?: number
  menuItems?: MenuItems
}

/** Default gap (px) between canvas tiles; also the value used when a host
 *  supplies settings without a tileSpacing field. */
export const DEFAULT_TILE_SPACING = 4

export const defaultSettings: NiiVueSettings = {
  showCrosshairs: true,
  interpolation: true,
  colorbar: false,
  radiologicalConvention: false,
  zoomDragMode: false,
  worldSpace: false,
  defaultVolumeColormap: 'gray',
  defaultOverlayColormap: 'redyell',
  defaultOverlayOpacity: 0.5,
  defaultMeshOverlayColormap: 'hsv',
  tileSpacing: DEFAULT_TILE_SPACING,
  menuItems: {
    home: true,
    addImage: true,
    view: true,
    zoom: true,
    colorScale: true,
    overlay: true,
    header: true,
    navigation: true,
    saveScene: true,
  },
}
