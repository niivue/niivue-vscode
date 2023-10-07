import { html } from 'htm/preact'
import { Scaling } from './Scaling'

export const OverlayOptions = ({ nv }) => {
  const isVolumeOverlay = nv.volumes.length > 1
  const isMeshOverlay = nv.meshes.length > 0 && nv.meshes[0].layers.length > 0

  if (!isVolumeOverlay && !isMeshOverlay) {
    return html``
  }

  const layers = isVolumeOverlay ? nv.volumes : nv.meshes[0].layers
  const overlay = layers[layers.length - 1]

  const colormaps = isVolumeOverlay
    ? ['symmetric', ...nv.colormaps()]
    : ['ge_color', 'hsv', 'symmetric', 'warm']
  return html`
    <${Scaling}
      setScaling=${(scaling) => setOverlayScaling(nv, isVolumeOverlay, scaling)}
      init=${overlay}
    />
    <select
      onchange=${(e) => setOverlayColormap(nv, isVolumeOverlay, e.target.value)}
      value=${overlay.colormap}
    >
      ${colormaps.map((c) => html`<option value=${c}>${c}</option>`)}
    </select>
  `
}

function setOverlayScaling(nv, isVolumeOverlay, scaling) {
  if (isVolumeOverlay) {
    const overlay = nv.volumes[nv.volumes.length - 1]
    overlay.cal_min = scaling.min
    overlay.cal_max = scaling.max
  } else {
    const layerNumber = nv.meshes[0].layers.length - 1
    nv.setMeshLayerProperty(
      nv.meshes[0].id,
      layerNumber,
      'cal_min',
      scaling.min,
    )
    nv.setMeshLayerProperty(
      nv.meshes[0].id,
      layerNumber,
      'cal_max',
      scaling.max,
    )
  }
  nv.updateGLVolume()
}
function setOverlayColormap(nv, isVolumeOverlay, colormap) {
  if (isVolumeOverlay) {
    const overlay = nv.volumes[nv.volumes.length - 1]
    if (colormap === 'symmetric') {
      overlay.useNegativeCmap = true
      overlay.colormap = 'warm'
      overlay.colormapNegative = 'winter'
    } else {
      overlay.useNegativeCmap = false
      overlay.colormap = colormap
      overlay.colormapNegative = ''
    }
  } else {
    const layerNumber = nv.meshes[0].layers.length - 1
    if (colormap === 'symmetric') {
      nv.setMeshLayerProperty(
        nv.meshes[0].id,
        layerNumber,
        'useNegativeCmap',
        true,
      )
      nv.setMeshLayerProperty(nv.meshes[0].id, layerNumber, 'colormap', 'warm')
      nv.setMeshLayerProperty(
        nv.meshes[0].id,
        layerNumber,
        'colormapNegative',
        'winter',
      )
    } else {
      nv.setMeshLayerProperty(
        nv.meshes[0].id,
        layerNumber,
        'useNegativeCmap',
        false,
      )
      nv.setMeshLayerProperty(
        nv.meshes[0].id,
        layerNumber,
        'colormap',
        colormap,
      )
      nv.setMeshLayerProperty(
        nv.meshes[0].id,
        layerNumber,
        'colormapNegative',
        '',
      )
    }
  }
  nv.updateGLVolume()
}
