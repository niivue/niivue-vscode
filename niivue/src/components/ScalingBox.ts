import { computed } from '@preact/signals'
import { html } from 'htm/preact/index.js'
import { useRef, useEffect } from 'preact/hooks'

export interface ScalingOpts {
  isManual: boolean
  min: number
  max: number
}
export const ScalingBox = (props: any) => {
  const { nvArraySelected, selectedOverlayNumber, overlayMenu, visible } = props
  if (visible && !visible.value) return html``

  const selectedOverlay = computed(() => getOverlay(nvArraySelected.value[0]))

  const setScaling = (val: ScalingOpts) => {
    nvArraySelected.value.forEach((nv: Niivue) => {
      handleOverlayScaling(nv, selectedOverlayNumber.value, val)
    })
  }

  const colormaps = computed(() => {
    const isVolume = nvArraySelected.value[0]?.volumes?.length > 0
    if (isVolume) {
      return ['symmetric', ...nvArraySelected.value[0].colormaps()]
    } else {
      return ['ge_color', 'hsv', 'symmetric', 'warm']
    }
  })

  const changeColormap = (e: any) => {
    const colormap = e.target.value
    nvArraySelected.value.forEach((nv: Niivue) => {
      handleOverlayColormap(nv, selectedOverlayNumber.value, colormap)
    })
  }

  const changeOpacity = (e: any) => {
    const opacity = e.target.value
    nvArraySelected.value.forEach((nv: Niivue) => {
      handleOpacity(nv, selectedOverlayNumber.value, opacity)
    })
  }

  return html`
    <div class="absolute left-8 top-8 bg-gray-500 rounded-md z-50 space-y-1 space-x-1 p-1">
      <${Scaling} setScaling=${setScaling} init=${selectedOverlay.value} />
      <select
        class="bg-gray-600 w-24 border-2 border-gray-600 rounded-md"
        onchange=${changeColormap}
        value=${selectedOverlay.value.colormap}
      >
        ${colormaps.value.map((c) => html`<option value=${c}>${c}</option>`)}
      </select>
      <input
        class="bg-gray-600 w-16 border-2 border-gray-600 rounded-md"
        type="number"
        value=${selectedOverlay.value.opacity}
        onchange=${changeOpacity}
        min="0"
        max="1"
        step="0.1"
      />
      <button
        class="bg-gray-600 border-2 border-gray-600 rounded-md w-16 opacity-50 cursor-not-allowed"
        onclick=${() => console.log('Not implemented yet')}
      >
        Hide
      </button>
      <br />
      <button
        class="bg-gray-600 border-2 border-gray-600 rounded-md w-16"
        onclick=${() => (overlayMenu.value = false)}
      >
        Close
      </button>
    </div>
  `
}

interface ScalingProps {
  setScaling: Function
  init: any
}
export const Scaling = ({ setScaling, init }: ScalingProps) => {
  const minRef = useRef<HTMLInputElement>()
  const maxRef = useRef<HTMLInputElement>()
  useEffect(() => {
    if (!minRef.current || !maxRef.current) {
      return
    }
    minRef.current.value = init.cal_min.toPrecision(2)
    maxRef.current.value = init.cal_max.toPrecision(2)
    const step = ((init.cal_max - init.cal_min) / 10).toPrecision(2)
    minRef.current.step = step
    maxRef.current.step = step
  }, [init])
  const update = () =>
    setScaling({
      isManual: true,
      min: parseFloat(minRef.current?.value ?? '0'),
      max: parseFloat(maxRef.current?.value ?? '1'),
    } as ScalingOpts)
  return html`
    <div clas="relative">
      <label class="items-baseline h-6 px-2">
        <span>Min </span>
        <input
          class="border-2 border-gray-600 rounded-md bg-gray-700 h-6 w-20"
          type="number"
          ref=${minRef}
          onchange=${update}
        />
      </label>
      <label class="items-baseline h-6 px-2">
        <span>Max </span>
        <input
          class="border-2 border-gray-600 rounded-md bg-gray-700 h-6 w-20"
          type="number"
          ref=${maxRef}
          onchange=${update}
        />
      </label>
    </div>
  `
}

function isVolumeOverlay(nv: Niivue) {
  return nv.volumes.length > 0
}

function handleOverlayScaling(nv: Niivue, layerNumber: number, scaling: ScalingOpts) {
  if (isVolumeOverlay(nv)) {
    const overlay = nv.volumes[layerNumber]
    if (overlay) {
      overlay.cal_min = scaling.min
      overlay.cal_max = scaling.max
    }
  } else {
    nv.setMeshLayerProperty(nv.meshes[0].id, layerNumber, 'cal_min', scaling.min)
    nv.setMeshLayerProperty(nv.meshes[0].id, layerNumber, 'cal_max', scaling.max)
  }
  nv.updateGLVolume()
}

function handleOpacity(nv: Niivue, layerNumber: number, opacity: number) {
  if (isVolumeOverlay(nv)) {
    if (nv.volumes[layerNumber]) {
      nv.setOpacity(layerNumber, opacity)
    }
  } else {
    nv.setMeshLayerProperty(nv.meshes[0].id, layerNumber, 'opacity', opacity)
  }
  nv.updateGLVolume()
}

function handleOverlayColormap(nv: Niivue, layerNumber: number, colormap: string) {
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

function getOverlay(nv: Niivue) {
  const layers = isVolumeOverlay(nv) ? nv.volumes : nv.meshes[0].layers
  return layers[layers.length - 1]
}
