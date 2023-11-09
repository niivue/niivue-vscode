import { html } from 'htm/preact'
import { addImagesEvent } from '../events'
import { NearestInterpolation } from './NearestInterpolation'
import { Scaling } from './Scaling'
import { SelectView } from './SelectView'
import { Niivue } from '@niivue/niivue'
import { AppProps, ScalingOpts } from './App'

export const Footer = ({
  footerRef,
  sliceType,
  interpolation,
  scaling,
  nv0,
  nvArray,
  location,
  hideUI,
  crosshair,
  radiologicalConvention,
  colorbar,
}: AppProps) => {
  const nv = nv0.value
  const ready = nv.isLoaded
  const isVolume = ready && nv.volumes.length > 0
  const isMesh = ready && nv.meshes.length > 0

  const handleHideUI = () => {
    hideUI.value = (hideUI.value + 1) % 4
  }
  const toggleCrosshair = () => {
    crosshair.value = !crosshair.value
  }
  const toggleRadiologicalConvention = () => {
    radiologicalConvention.value = !radiologicalConvention.value
  }
  const setScaling = (val: ScalingOpts) => (scaling.value = val)
  const toggleColorbar = () => {
    colorbar.value = !colorbar.value
  }

  const setVoxelSize1AndOrigin0 = () => {
    nvArray.value.forEach((nv) => {
      nv.volumes.forEach((vol: any) => {
        vol.hdr.pixDims[1] = 1
        vol.hdr.pixDims[2] = 1
        vol.hdr.pixDims[3] = 1
        vol.hdr.qoffset_x = 0
        vol.hdr.qoffset_y = 0
        vol.hdr.qoffset_z = 0
        vol.calculateRAS()
      })
    })
    nv0.value = nvArray.value[nvArray.value.length - 1]
  }

  const resetZoom = () => {
    nvArray.value.forEach((nv) => {
      nv.uiData.pan2Dxyzmm = [0, 0, 0, 1]
      nv.drawScene()
    })
  }

  return html`
    <div ref=${footerRef}>
      <div>${location}</div>
      <div class="horizontal-layout">
        <button onClick=${addImagesEvent}>Add Images</button>
        <${NearestInterpolation} interpolation=${interpolation} />
        ${isVolume &&
        html`
          <button onClick=${toggleRadiologicalConvention}>RL</button>
          <${Scaling} setScaling=${setScaling} init=${nv.volumes[0]} />
        `}
        <${SelectView} sliceType=${sliceType} />
        ${isMesh &&
        html`
          <button onClick=${() => saveScene(nv0)}>Save Scene</button>
          <button onClick=${() => loadScene(nv0)}>Load Scene</button>
        `}
        <button onClick=${handleHideUI}>👁</button>
        <button onClick=${toggleColorbar}>📏</button>
        <button onClick=${toggleCrosshair}>⌖</button>
        ${isVolume &&
        html`
          <button onClick=${setVoxelSize1AndOrigin0}>VoxelSize1</button>
          <button onClick=${resetZoom}>ResetZoom</button>
        `}
      </div>
    </div>
  `
}
      
function saveScene(nv: Niivue) {
  const scene = nv.scene
  const json = JSON.stringify(scene)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'scene.json'
  a.click()
}

function loadScene(nv: Niivue) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement)?.files?.[0]
    if (!file) {
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (result) {
        const json = JSON.parse(result.toString())
        nv.scene = json
        nv.updateGLVolume()
        syncAll(nv)
      }
    }
    reader.readAsText(file)
  }
  input.click()
}

// This function is identical to nv.sync, but ignores the focus requirement
export function syncAll(nv: Niivue) {
  if (!nv.otherNV || typeof nv.otherNV === 'undefined') {
    return
  }
  let thisMM = nv.frac2mm(nv.scene.crosshairPos)
  // if nv.otherNV is an object, then it is a single Niivue instance
  if (nv.otherNV instanceof Niivue) {
    if (nv.syncOpts['2d']) {
      nv.otherNV.scene.crosshairPos = nv.otherNV.mm2frac(thisMM)
    }
    if (nv.syncOpts['3d']) {
      nv.otherNV.scene.renderAzimuth = nv.scene.renderAzimuth
      nv.otherNV.scene.renderElevation = nv.scene.renderElevation
    }
    nv.otherNV.drawScene()
    nv.otherNV.createOnLocationChange()
  } else if (Array.isArray(nv.otherNV)) {
    for (let i = 0; i < nv.otherNV.length; i++) {
      if (nv.otherNV[i] == nv) {
        continue
      }
      if (nv.syncOpts['2d']) {
        nv.otherNV[i].scene.crosshairPos = nv.otherNV[i].mm2frac(thisMM)
      }
      if (nv.syncOpts['3d']) {
        nv.otherNV[i].scene.renderAzimuth = nv.scene.renderAzimuth
        nv.otherNV[i].scene.renderElevation = nv.scene.renderElevation
      }
      nv.otherNV[i].drawScene()
      nv.otherNV[i].createOnLocationChange()
    }
  }
}
