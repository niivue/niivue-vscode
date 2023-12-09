export function getColormaps(nv: Niivue) {
  if (isVolumeOverlay(nv)) {
    return ['symmetric', ...nv.colormaps()]
  }
  return ['ge_color', 'hsv', 'symmetric', 'warm']
}

function isVolumeOverlay(nv: Niivue) {
  return nv.volumes.length > 0
}

export function handleOpacity(nv: Niivue, layerNumber: number, opacity: number) {
  if (isVolumeOverlay(nv)) {
    nv.setOpacity(layerNumber, opacity)
  } else {
    nv.setMeshLayerProperty(nv.meshes[0].id, layerNumber, 'opacity', opacity)
  }
  nv.updateGLVolume()
}

export function handleOverlayColormap(nv: Niivue, layerNumber: number, colormap: string) {
  if (isVolumeOverlay(nv)) {
    setVolumeColormap(nv, layerNumber, colormap)
  } else {
    setMeshColormap(nv, layerNumber, colormap)
  }
  nv.updateGLVolume()
}

function setVolumeColormap(nv: Niivue, layerNumber: number, colormap: string) {
  const overlay = nv.volumes?.[layerNumber]
  if (!overlay) {
    return
  }
  if (colormap === 'symmetric') {
    overlay.useNegativeCmap = true
    overlay.colormap = 'warm'
    overlay.colormapNegative = 'winter'
  } else {
    overlay.useNegativeCmap = false
    overlay.colormap = colormap
    overlay.colormapNegative = ''
  }
}

function setMeshColormap(nv: Niivue, layerNumber: number, colormap: string) {
  const id = nv.meshes[0].id
  if (colormap === 'symmetric') {
    nv.setMeshLayerProperty(id, layerNumber, 'useNegativeCmap', true)
    nv.setMeshLayerProperty(id, layerNumber, 'colormap', 'warm')
    nv.setMeshLayerProperty(id, layerNumber, 'colormapNegative', 'winter')
  } else {
    nv.setMeshLayerProperty(id, layerNumber, 'useNegativeCmap', false)
    nv.setMeshLayerProperty(id, layerNumber, 'colormap', colormap)
    nv.setMeshLayerProperty(id, layerNumber, 'colormapNegative', '')
  }
}
