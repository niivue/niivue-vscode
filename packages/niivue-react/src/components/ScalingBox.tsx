import { computed, useSignal } from '@preact/signals'
import { useEffect, useRef } from 'preact/hooks'
import { ExtendedNiivue } from '../events'

export interface ScalingOpts {
  isManual: boolean
  min: number
  max: number
}

export const ScalingBox = (props: any) => {
  const { nvArraySelected, selectedOverlayNumber, overlayMenu, visible } = props
  if (visible && !visible.value) return null

  const selectedOverlay = computed(() =>
    getOverlay(nvArraySelected.value[0], selectedOverlayNumber.value),
  )
  const invertState = useSignal<boolean>(!!selectedOverlay.value.isColormapInverted)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') overlayMenu.value = false
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const setScaling = (val: ScalingOpts) => {
    nvArraySelected.value.forEach((nv: ExtendedNiivue) => {
      handleOverlayScaling(nv, selectedOverlayNumber.value, val)
    })
  }

  const colormaps = computed(() => {
    const isVolume = nvArraySelected.value[0]?.volumes?.length > 0
    if (isVolume) {
      // v1: `colormaps` is a getter property (string[]), no longer a method.
      return ['symmetric', ...nvArraySelected.value[0].colormaps]
    } else {
      return ['ge_color', 'gray', 'hsv', 'symmetric', 'warm']
    }
  })

  const changeColormap = (e: any) => {
    const colormap = e.target.value
    nvArraySelected.value.forEach((nv: ExtendedNiivue) => {
      handleOverlayColormap(nv, selectedOverlayNumber.value, colormap)
    })
  }

  const changeOpacity = (e: any) => {
    const opacity = e.target.value
    nvArraySelected.value.forEach((nv: ExtendedNiivue) => {
      handleOpacity(nv, selectedOverlayNumber.value, opacity)
    })
  }

  const changeInverted = () => {
    invertState.value = !selectedOverlay.value.isColormapInverted
    nvArraySelected.value.forEach((nv: ExtendedNiivue) => {
      handleOverlayInvert(nv, selectedOverlayNumber.value, invertState.value!)
    })
  }

  return (
    <div className="absolute left-8 top-8 bg-gray-500 rounded-md z-50 space-y-1 space-x-1 p-1">
      <Scaling setScaling={setScaling} init={selectedOverlay.value} />
      <select
        className="bg-gray-600 w-24 border-2 border-gray-600 rounded-md"
        onChange={changeColormap}
        value={selectedOverlay.value.colormap}
      >
        {colormaps.value.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <input
        className="bg-gray-600 w-16 border-2 border-gray-600 rounded-md"
        type="number"
        value={selectedOverlay.value.opacity}
        onChange={changeOpacity}
        min="0"
        max="1"
        step="0.1"
      />
      <button
        className={`border-2 border-gray-600 rounded-md w-16 ${
          invertState.value ? 'bg-white text-gray-600' : 'bg-gray-600'
        }`}
        onClick={changeInverted}
      >
        Invert
      </button>
      <button
        className="bg-gray-600 border-2 border-gray-600 rounded-md w-16 float-right"
        onClick={() => (overlayMenu.value = false)}
      >
        Close
      </button>
    </div>
  )
}

interface ScalingProps {
  setScaling: (scaling: ScalingOpts) => void
  init: any
}

export const Scaling = ({ setScaling, init }: ScalingProps) => {
  const minRef = useRef<HTMLInputElement | null>(null)
  const maxRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!minRef.current || !maxRef.current) {
      return
    }
    minRef.current.value = init.calMin.toPrecision(2)
    maxRef.current.value = init.calMax.toPrecision(2)
    const step = ((init.calMax - init.calMin) / 10).toPrecision(2)
    minRef.current.step = step
    maxRef.current.step = step
  }, [init])

  const update = () =>
    setScaling({
      isManual: true,
      min: parseFloat(minRef.current?.value ?? '0'),
      max: parseFloat(maxRef.current?.value ?? '1'),
    } as ScalingOpts)

  return (
    <div className="relative">
      <label className="items-baseline h-6 px-2">
        <span>Min </span>
        <input
          className="border-2 border-gray-600 rounded-md bg-gray-700 h-6 w-20"
          type="number"
          ref={minRef}
          onKeyDown={(e: any) => {
            if (e.key === 'Enter') update()
          }}
        />
      </label>
      <label className="items-baseline h-6 px-2">
        <span>Max </span>
        <input
          className="border-2 border-gray-600 rounded-md bg-gray-700 h-6 w-20"
          type="number"
          ref={maxRef}
          onKeyDown={(e: any) => {
            if (e.key === 'Enter') update()
          }}
        />
      </label>
      <button className="bg-gray-600 border-2 border-gray-600 rounded-md w-16" onClick={update}>
        Apply
      </button>
    </div>
  )
}

function isVolumeOverlay(nv: ExtendedNiivue) {
  return nv.volumes.length > 0
}

function handleOverlayInvert(nv: ExtendedNiivue, layerNumber: number, invert: boolean) {
  if (isVolumeOverlay(nv)) {
    const overlay = nv.volumes[layerNumber]
    if (overlay) {
      overlay.isColormapInverted = invert
    }
  } else {
    // v1: setMeshLayerProperty(meshIndex, layerIndex, { camelCaseKey }); meshIndex 0.
    nv.setMeshLayerProperty(0, layerNumber, { isColormapInverted: invert })
  }
  nv.updateGLVolume()
}

function handleOverlayScaling(nv: ExtendedNiivue, layerNumber: number, scaling: ScalingOpts) {
  if (isVolumeOverlay(nv)) {
    const overlay = nv.volumes[layerNumber]
    if (overlay) {
      overlay.calMin = scaling.min
      overlay.calMax = scaling.max
    }
  } else {
    nv.setMeshLayerProperty(0, layerNumber, { calMin: scaling.min, calMax: scaling.max })
  }
  nv.updateGLVolume()
}

function handleOpacity(nv: ExtendedNiivue, layerNumber: number, opacity: number) {
  if (isVolumeOverlay(nv)) {
    if (nv.volumes[layerNumber]) {
      nv.setVolume(layerNumber, { opacity })
    }
  } else {
    nv.setMeshLayerProperty(0, layerNumber, { opacity })
  }
  nv.updateGLVolume()
}

function handleOverlayColormap(nv: ExtendedNiivue, layerNumber: number, colormap: string) {
  if (isVolumeOverlay(nv)) {
    setVolumeColormap(nv, layerNumber, colormap)
  } else {
    setMeshColormap(nv, layerNumber, colormap)
  }
  nv.updateGLVolume()
}

function setVolumeColormap(nv: ExtendedNiivue, layerNumber: number, colormap: string) {
  const overlay = nv.volumes?.[layerNumber]
  if (!overlay) {
    return
  }
  if (colormap === 'symmetric') {
    overlay.colormap = 'warm'
    overlay.colormapNegative = 'winter'
  } else {
    overlay.colormap = colormap
    overlay.colormapNegative = ''
  }
}

function setMeshColormap(nv: ExtendedNiivue, layerNumber: number, colormap: string) {
  // v1: setMeshLayerProperty(meshIndex, layerIndex, { ...options }); meshIndex 0.
  // A non-empty colormapNegative enables the negative map (old useNegativeCmap).
  if (colormap === 'symmetric') {
    nv.setMeshLayerProperty(0, layerNumber, { colormap: 'warm', colormapNegative: 'winter' })
  } else {
    nv.setMeshLayerProperty(0, layerNumber, { colormap, colormapNegative: '' })
  }
}

function getOverlay(nv: ExtendedNiivue, layerNumber: number) {
  const layers = isVolumeOverlay(nv) ? nv.volumes : nv.meshes[0].layers
  return layers[layerNumber]
}
