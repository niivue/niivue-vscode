import { html } from 'htm/preact'
import { Scaling } from './Scaling'

interface OverlayOptionsProps {
  nv: Niivue
}

export const OverlayOptions = ({ nv }: OverlayOptionsProps) => {
  if (!isVolumeOverlay(nv) && !isMeshOverlay(nv)) {
    return html``
  }

  const overlay = getOverlay(nv)
  const colormaps = getColormaps(nv)

  return html`
    <${Scaling} setScaling=${handleOverlayScaling(nv)} init=${overlay} />
    <select onchange=${handleOverlayColormap(nv)} value=${overlay.colormap}>
      ${colormaps.map((c) => html`<option value=${c}>${c}</option>`)}
    </select>
    <input
      type="number"
      value=${overlay.opacity}
      onchange=${handleOpacity(nv)}
      min="0"
      max="1"
      step="0.1"
    />
  `
}

function getColormaps(nv: Niivue) {
  if (isVolumeOverlay(nv)) {
    return ['symmetric', ...nv.colormaps()]
  } else {
    return ['ge_color', 'hsv', 'symmetric', 'warm']
  }
}

function getOverlay(nv: Niivue) {
  const layers = isVolumeOverlay(nv) ? nv.volumes : nv.meshes[0].layers
  return layers[layers.length - 1]
}

function isVolumeOverlay(nv: Niivue) {
  return nv.volumes.length > 1
}
function isMeshOverlay(nv: Niivue) {
  return nv.meshes.length > 0 && nv.meshes[0].layers.length > 1
}

function handleOpacity(nv: Niivue) {
  return (e: any) => {
    const opacity = e.target.value
    if (isVolumeOverlay(nv)) {
      const idx = nv.volumes.length - 1
      nv.setOpacity(idx, opacity)
    } else {
      const layerNumber = nv.meshes[0].layers.length - 1
      nv.setMeshLayerProperty(nv.meshes[0].id, layerNumber, 'opacity', opacity)
    }
    nv.updateGLVolume()
  }
}

function handleOverlayScaling(nv: Niivue) {
  return (scaling: any) => {
    if (isVolumeOverlay(nv)) {
      const overlay = nv.volumes[nv.volumes.length - 1]
      overlay.cal_min = scaling.min
      overlay.cal_max = scaling.max
    } else {
      const layerNumber = nv.meshes[0].layers.length - 1
      nv.setMeshLayerProperty(
        nv.meshes[0].id,
        layerNumber,
        'cal_min',
        scaling.min
      )
      nv.setMeshLayerProperty(
        nv.meshes[0].id,
        layerNumber,
        'cal_max',
        scaling.max
      )
    }
    nv.updateGLVolume()
  }
}

function handleOverlayColormap(nv: Niivue) {
  return (e: any) => {
    const colormap = e.target.value
    if (isVolumeOverlay(nv)) {
      setVolumeColormap(nv, colormap)
    } else {
      setMeshColormap(nv, colormap)
    }
    nv.updateGLVolume()
  }
}

function setVolumeColormap(nv: Niivue, colormap: string) {
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
}

function setMeshColormap(nv: Niivue, colormap: string) {
  const layerNumber = nv.meshes[0].layers.length - 1
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