import { computed, useSignal } from '@preact/signals'
import { useEffect, useRef } from 'preact/hooks'
import { ExtendedNiivue } from '../events'
import { LabelSelectionPanel } from './LabelSelectionPanel'
import {
  applyLabelVisibility,
  buildColormapLabel,
  detectLabelValues,
  detectLabelValuesAcross,
  getOverlayLabels,
  isLabelOverlay,
  LabelInfo,
  mergeLabelLists,
} from './labelSelection'

export interface ScalingOpts {
  isManual: boolean
  min: number
  max: number
}

// Sentinel value for the colormap dropdown meaning "render as labels" instead of
// a continuous color scale. Picking any real colormap leaves label mode.
const LABELS_COLORMAP = 'labels'

export const ScalingBox = (props: any) => {
  const { nvArraySelected, selectedOverlayNumber, overlayMenu, visible } = props
  if (visible && !visible.value) return null

  const selectedOverlay = computed(() =>
    getOverlay(nvArraySelected.value[0], selectedOverlayNumber.value),
  )
  const invertState = useSignal<boolean>(!!selectedOverlay.value.isColormapInverted)
  const labelSelectionOpen = useSignal(false)
  const labelVisibility = useSignal<Record<number, boolean>>({})
  const labelsList = useSignal<LabelInfo[]>([])
  // True when the selected layer is an integer image that can be turned into a
  // label map - exposed via the "labels" colormap option.
  const labelCapable = useSignal(false)

  // The selected layer's overlay on each selected canvas, paired with its
  // instance. Mesh-only canvases (no volumes) drop out. The per-label controls
  // act across every selected canvas, matching the rest of this component.
  const selectedOverlays = () =>
    nvArraySelected.value
      .map((nv: ExtendedNiivue) => ({
        nv,
        overlay: isVolumeOverlay(nv) ? nv.volumes[selectedOverlayNumber.value] : undefined,
      }))
      .filter((entry: { overlay?: unknown }) => entry.overlay)

  // True when any selected canvas's layer is an integer label map.
  const anyLabelCapable = () =>
    selectedOverlays().some(({ overlay }: any) => !!detectLabelValues(overlay)?.length)

  // Build one color table from the union of label values across every selected
  // label-map canvas, then apply it to each of them. Building from the union -
  // rather than just the first canvas - is what lets labels render correctly
  // when several files with different label ranges are open at once. Non-label
  // canvases (e.g. a continuous anatomical image) are left untouched.
  const enableLabels = () => {
    const overlays = selectedOverlays()
    const values = detectLabelValuesAcross(overlays.map(({ overlay }: any) => overlay))
    if (values.length === 0) {
      return
    }
    const built = buildColormapLabel(values)
    overlays.forEach(({ nv, overlay }: any) => {
      if (detectLabelValues(overlay)?.length) {
        overlay.colormapLabel = { lut: new Uint8ClampedArray(built.lut) }
        nv.updateGLVolume()
      }
    })
    labelVisibility.value = {}
    labelsList.value = getOverlayLabels(built)
    labelCapable.value = false
  }

  // Clear the label color table on every selected canvas so the layer renders
  // with its normal colormap again (the "go back to a color scale" path), then
  // re-offer the "labels" option since the image is still an integer label map.
  const disableLabels = () => {
    selectedOverlays().forEach(({ nv, overlay }: any) => {
      overlay.colormapLabel = null
      nv.updateGLVolume()
    })
    labelsList.value = []
    labelVisibility.value = {}
    labelSelectionOpen.value = false
    labelCapable.value = anyLabelCapable()
  }

  // Detect what label controls apply across the selected canvases. Per-label
  // controls are only offered for INTEGER label maps:
  //   - any canvas already has a color table -> list those labels (unioned)
  //   - integer data otherwise               -> offer the "labels" option to opt in
  // Labels are never auto-applied on open; the user opts in via the dropdown.
  useEffect(() => {
    labelCapable.value = false
    const overlays = selectedOverlays()
    if (overlays.length === 0) {
      labelsList.value = []
      labelSelectionOpen.value = false
      return
    }
    const labelled = overlays.filter(({ overlay }: any) => isLabelOverlay(overlay))
    if (labelled.length > 0) {
      labelVisibility.value = {}
      labelsList.value = mergeLabelLists(
        labelled.map(({ overlay }: any) => getOverlayLabels(overlay.colormapLabel)),
      )
      return
    }
    labelsList.value = []
    labelSelectionOpen.value = false
    labelCapable.value = anyLabelCapable()
  }, [selectedOverlayNumber.value])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        overlayMenu.value = false
        labelSelectionOpen.value = false
      }
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
    // v1: `colormaps` is a getter property (string[]), no longer a method.
    const scales = isVolume
      ? ['symmetric', ...nvArraySelected.value[0].colormaps]
      : ['ge_color', 'gray', 'hsv', 'symmetric', 'warm']
    // Integer label maps render as labels; offer that as a colormap choice so
    // picking any real color scale leaves label mode.
    return labelCapable.value || labelsList.value.length > 0 ? [LABELS_COLORMAP, ...scales] : scales
  })

  const changeColormap = (e: any) => {
    const colormap = e.target.value
    if (colormap === LABELS_COLORMAP) {
      if (labelsList.value.length === 0) {
        enableLabels()
      }
      return
    }
    // Selecting a real color scale leaves label mode (back to normal rendering).
    if (labelsList.value.length > 0) {
      disableLabels()
    }
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

  const handleLabelSelectionClick = () => {
    labelSelectionOpen.value = !labelSelectionOpen.value
  }

  // Apply the current visibility map to every selected canvas, matching the
  // multi-canvas behaviour of the other overlay controls in this component.
  const applyVisibility = (visibility: Record<number, boolean>) => {
    nvArraySelected.value.forEach((nv: ExtendedNiivue) => {
      updateLabelVisibility(nv, selectedOverlayNumber.value, visibility)
    })
  }

  const handleLabelToggle = (labelValue: number, visible: boolean) => {
    labelVisibility.value = { ...labelVisibility.value, [labelValue]: visible }
    labelsList.value = labelsList.value.map((label) =>
      label.value === labelValue ? { ...label, visible } : label,
    )
    applyVisibility(labelVisibility.value)
  }

  const setAllLabels = (visible: boolean) => {
    const newVisibility: Record<number, boolean> = {}
    labelsList.value.forEach((label) => {
      newVisibility[label.value] = visible
    })
    labelVisibility.value = newVisibility
    labelsList.value = labelsList.value.map((label) => ({ ...label, visible }))
    applyVisibility(newVisibility)
  }

  const handleSelectAll = () => setAllLabels(true)
  const handleDeselectAll = () => setAllLabels(false)

  const hasLabels = labelsList.value.length > 0

  return (
    <div className="absolute left-8 top-8 bg-gray-500 rounded-md z-50 space-y-1 space-x-1 p-1">
      <Scaling setScaling={setScaling} init={selectedOverlay.value} />
      <select
        className="bg-gray-600 w-24 border-2 border-gray-600 rounded-md"
        onChange={changeColormap}
        value={labelsList.value.length > 0 ? LABELS_COLORMAP : selectedOverlay.value.colormap}
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
      {hasLabels && (
        <button
          className={`border-2 border-gray-600 rounded-md w-16 ${
            labelSelectionOpen.value ? 'bg-white text-gray-600' : 'bg-gray-600'
          }`}
          onClick={handleLabelSelectionClick}
          title="Toggle label visibility"
        >
          Labels
        </button>
      )}
      <button
        className="bg-gray-600 border-2 border-gray-600 rounded-md w-16 float-right"
        onClick={() => {
          overlayMenu.value = false
          labelSelectionOpen.value = false
        }}
      >
        Close
      </button>

      {labelSelectionOpen.value && hasLabels && (
        <LabelSelectionPanel
          labels={labelsList.value}
          onLabelToggle={handleLabelToggle}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onClose={() => (labelSelectionOpen.value = false)}
        />
      )}
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

/**
 * Apply per-label visibility to a single canvas by rewriting the alpha bytes of
 * the overlay's colour-table LUT and refreshing the GL volume. Mesh layers have
 * no colormapLabel and are ignored.
 */
function updateLabelVisibility(
  nv: ExtendedNiivue,
  layerNumber: number,
  labelVisibility: Record<number, boolean>,
) {
  if (!isVolumeOverlay(nv)) {
    return
  }
  const overlay = nv.volumes[layerNumber]
  if (!overlay?.colormapLabel?.lut) {
    return
  }
  overlay.colormapLabel = {
    ...overlay.colormapLabel,
    lut: applyLabelVisibility(overlay.colormapLabel.lut, labelVisibility),
  }
  nv.updateGLVolume()
}
