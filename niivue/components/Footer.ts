import { html } from 'htm/preact'
import { addImagesEvent } from '../events'
import { NearestInterpolation } from './NearestInterpolation'
import { Scaling } from './Scaling'
import { SelectView } from './SelectView'
import { Niivue } from '@niivue/niivue'
import { Signal } from '@preact/signals'

export interface FooterProps {
  footerRef: any
  sliceType: Signal<number>
  interpolation: Signal<boolean>
  setScaling: any
  nv0: Niivue
  location: Signal<string>
  setHideUI: any
  setCrosshair: any
  radiologicalConvention: Signal<boolean>
}

export const Footer = ({
  footerRef,
  sliceType,
  interpolation,
  setScaling,
  nv0,
  location,
  setHideUI,
  setCrosshair,
  radiologicalConvention,
}: FooterProps) => {
  const ready = nv0.isLoaded
  const isVolume = ready && nv0.volumes.length > 0
  const isMesh = ready && nv0.meshes.length > 0

  const handleHideUI = () => {
    setHideUI((hideUI: number) => (hideUI + 1) % 3)
  }
  const handleCrosshair = () => {
    setCrosshair((crosshair: boolean) => !crosshair)
  }
  const handleRadiologicalConvention = () => {
    radiologicalConvention.value = !radiologicalConvention.value
  }

  return html`
    <div ref=${footerRef}>
      <div>${location}</div>
      <div class="horizontal-layout">
        <button onClick=${addImagesEvent}>Add Images</button>
        <${NearestInterpolation} interpolation=${interpolation} />
        ${isVolume &&
        html`
          <button onClick=${handleRadiologicalConvention}>RL</button>
          <${Scaling} setScaling=${setScaling} init=${nv0.volumes[0]} />
        `}
        <${SelectView} sliceType=${sliceType} />
        ${isMesh &&
        html`
          <button onClick=${() => saveScene(nv0)}>Save Scene</button>
          <button onClick=${() => loadScene(nv0)}>Load Scene</button>
        `}
        <button onClick=${handleHideUI}>👁</button>
        <button onClick=${handleCrosshair}>⌖</button>
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
