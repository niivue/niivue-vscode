import { html } from 'htm/preact'
import { Scaling } from './Scaling'

interface OverlayOptionsProps {
  nv: Niivue
}

export const OverlayOptions = ({ nv }: OverlayOptionsProps) => {
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
      setScaling=${handleOverlayScaling(nv, isVolumeOverlay)}
      init=${overlay}
    />
    <select
      onchange=${handleOverlayColormap(nv, isVolumeOverlay)}
      value=${overlay.colormap}
    >
      ${colormaps.map((c) => html`<option value=${c}>${c}</option>`)}
    </select>
  `
}

function handleOverlayScaling(nv: Niivue, isVolumeOverlay: boolean) {
  return (scaling: any) => {
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

function handleOverlayColormap(nv: Niivue, isVolumeOverlay: boolean) {
  return (e: any) => {
    const colormap = e.target.value
    if (isVolumeOverlay) {
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