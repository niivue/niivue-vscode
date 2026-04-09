import { SLICE_TYPE } from '@niivue/niivue'
import { Signal, useSignal } from '@preact/signals'
import { ColorScalingDefaults, UserPreset, ViewOptions, ViewPreset } from '../presets'
import { NiiVueSettings } from '../settings'

const SLICE_TYPE_OPTIONS = [
  { value: SLICE_TYPE.AXIAL, label: 'Axial' },
  { value: SLICE_TYPE.CORONAL, label: 'Coronal' },
  { value: SLICE_TYPE.SAGITTAL, label: 'Sagittal' },
  { value: SLICE_TYPE.MULTIPLANAR, label: 'Multiplanar' },
  { value: SLICE_TYPE.RENDER, label: 'Render' },
]

const COMMON_COLORMAPS = [
  'gray', 'hot', 'winter', 'warm', 'cool', 'redyell', 'red',
  'green', 'blue', 'copper', 'bone', 'hsv', 'jet', 'surface',
  'ge_color', 'symmetric',
]

interface PresetEditorProps {
  visible: Signal<boolean>
  existingPreset?: UserPreset
  currentSettings: {
    interpolation: boolean
    showCrosshairs: boolean
    radiologicalConvention: boolean
    colorbar: boolean
    zoomDragMode: boolean
  }
  currentViewOptions: {
    sliceType: number
    hideUI: number
  }
  currentBaseImage?: ColorScalingDefaults
  currentOverlay?: ColorScalingDefaults
  colormaps: string[]
  onSave: (preset: {
    name: string
    description: string
    settings: Partial<NiiVueSettings>
    viewOptions: ViewOptions
    baseImageDefaults?: ColorScalingDefaults
    overlayDefaults?: ColorScalingDefaults
    isDefault?: boolean
    id?: string
    createdAt?: string
  }) => void
}

export const PresetEditor = ({
  visible,
  existingPreset,
  currentSettings,
  currentViewOptions,
  currentBaseImage,
  currentOverlay,
  colormaps,
  onSave,
}: PresetEditorProps) => {
  if (!visible.value) return null

  const isEditing = !!existingPreset
  const init = existingPreset as ViewPreset | undefined

  // Name & description
  const name = useSignal(init?.name ?? '')
  const description = useSignal(init?.description ?? '')
  const isDefault = useSignal((existingPreset as UserPreset)?.isDefault ?? false)

  // View settings
  const interpolation = useSignal(init?.settings.interpolation ?? currentSettings.interpolation)
  const showCrosshairs = useSignal(init?.settings.showCrosshairs ?? currentSettings.showCrosshairs)
  const radiologicalConvention = useSignal(init?.settings.radiologicalConvention ?? currentSettings.radiologicalConvention)
  const colorbar = useSignal(init?.settings.colorbar ?? currentSettings.colorbar)
  const zoomDragMode = useSignal(init?.settings.zoomDragMode ?? currentSettings.zoomDragMode)

  // View options
  const sliceType = useSignal(init?.viewOptions?.sliceType ?? currentViewOptions.sliceType)
  const hideUI = useSignal(init?.viewOptions?.hideUI ?? currentViewOptions.hideUI)

  // Base image color scaling
  const baseColormap = useSignal(init?.baseImageDefaults?.colormap ?? currentBaseImage?.colormap ?? 'gray')
  const baseCmin = useSignal(init?.baseImageDefaults?.cal_min ?? currentBaseImage?.cal_min ?? 0)
  const baseCmax = useSignal(init?.baseImageDefaults?.cal_max ?? currentBaseImage?.cal_max ?? 1)
  const baseOpacity = useSignal(init?.baseImageDefaults?.opacity ?? currentBaseImage?.opacity ?? 1)
  const baseInvert = useSignal(init?.baseImageDefaults?.colormapInvert ?? currentBaseImage?.colormapInvert ?? false)

  // Overlay color scaling
  const overlayColormap = useSignal(init?.overlayDefaults?.colormap ?? currentOverlay?.colormap ?? 'redyell')
  const overlayCmin = useSignal(init?.overlayDefaults?.cal_min ?? currentOverlay?.cal_min ?? 0)
  const overlayCmax = useSignal(init?.overlayDefaults?.cal_max ?? currentOverlay?.cal_max ?? 1)
  const overlayOpacity = useSignal(init?.overlayDefaults?.opacity ?? currentOverlay?.opacity ?? 0.5)
  const overlayInvert = useSignal(init?.overlayDefaults?.colormapInvert ?? currentOverlay?.colormapInvert ?? false)

  const allColormaps = [...new Set([...COMMON_COLORMAPS, ...colormaps])]

  const handleSave = () => {
    if (!name.value.trim()) {
      alert('Please enter a name for the preset')
      return
    }
    onSave({
      name: name.value.trim(),
      description: description.value || 'Custom user preset',
      settings: {
        interpolation: interpolation.value,
        showCrosshairs: showCrosshairs.value,
        radiologicalConvention: radiologicalConvention.value,
        colorbar: colorbar.value,
        zoomDragMode: zoomDragMode.value,
      },
      viewOptions: {
        sliceType: sliceType.value,
        hideUI: hideUI.value,
      },
      baseImageDefaults: {
        colormap: baseColormap.value,
        cal_min: baseCmin.value,
        cal_max: baseCmax.value,
        opacity: baseOpacity.value,
        colormapInvert: baseInvert.value,
      },
      overlayDefaults: {
        colormap: overlayColormap.value,
        cal_min: overlayCmin.value,
        cal_max: overlayCmax.value,
        opacity: overlayOpacity.value,
        colormapInvert: overlayInvert.value,
      },
      isDefault: isDefault.value,
      id: existingPreset?.id,
      createdAt: existingPreset?.createdAt,
    })
    visible.value = false
  }

  const inputClass = 'bg-gray-600 w-full border border-gray-500 rounded px-2 py-0.5 text-sm'
  const numberInputClass = 'bg-gray-600 w-20 border border-gray-500 rounded px-2 py-0.5 text-sm'
  const selectClass = 'bg-gray-600 w-full border border-gray-500 rounded px-1 py-0.5 text-sm'
  const sectionClass = 'space-y-1.5'
  const labelClass = 'text-xs text-gray-300'
  const checkboxRow = 'flex items-center gap-2 text-sm'

  return (
    <div className="absolute left-8 top-8 bg-gray-800 border border-gray-600 rounded-lg z-50 p-4 space-y-3 w-80 max-h-[80vh] overflow-y-auto shadow-lg">
      <h3 className="text-base font-bold border-b border-gray-600 pb-2">
        {isEditing ? 'Edit Preset' : 'New Preset'}
      </h3>

      {/* Name & Description */}
      <div className={sectionClass}>
        <div>
          <label className={labelClass}>Name</label>
          <input
            className={inputClass}
            type="text"
            value={name.value}
            onInput={(e: Event) => { name.value = (e.target as HTMLInputElement).value }}
            placeholder="Preset name"
          />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <input
            className={inputClass}
            type="text"
            value={description.value}
            onInput={(e: Event) => { description.value = (e.target as HTMLInputElement).value }}
            placeholder="Optional description"
          />
        </div>
        <label className={checkboxRow}>
          <input
            type="checkbox"
            checked={isDefault.value}
            onChange={() => { isDefault.value = !isDefault.value }}
          />
          Set as default preset
        </label>
      </div>

      {/* View Settings */}
      <div className={sectionClass}>
        <h4 className="text-sm font-semibold text-gray-200">View Settings</h4>
        <label className={checkboxRow}>
          <input type="checkbox" checked={interpolation.value} onChange={() => { interpolation.value = !interpolation.value }} />
          Interpolation
        </label>
        <label className={checkboxRow}>
          <input type="checkbox" checked={showCrosshairs.value} onChange={() => { showCrosshairs.value = !showCrosshairs.value }} />
          Crosshairs
        </label>
        <label className={checkboxRow}>
          <input type="checkbox" checked={radiologicalConvention.value} onChange={() => { radiologicalConvention.value = !radiologicalConvention.value }} />
          Radiological Convention
        </label>
        <label className={checkboxRow}>
          <input type="checkbox" checked={colorbar.value} onChange={() => { colorbar.value = !colorbar.value }} />
          Colorbar
        </label>
        <label className={checkboxRow}>
          <input type="checkbox" checked={zoomDragMode.value} onChange={() => { zoomDragMode.value = !zoomDragMode.value }} />
          Zoom Drag Mode
        </label>
      </div>

      {/* View Options */}
      <div className={sectionClass}>
        <h4 className="text-sm font-semibold text-gray-200">View Options</h4>
        <div>
          <label className={labelClass}>Slice Type</label>
          <select
            className={selectClass}
            value={sliceType.value}
            onChange={(e: Event) => { sliceType.value = parseInt((e.target as HTMLSelectElement).value) }}
          >
            {SLICE_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>UI Visibility</label>
          <select
            className={selectClass}
            value={hideUI.value}
            onChange={(e: Event) => { hideUI.value = parseInt((e.target as HTMLSelectElement).value) }}
          >
            <option value={3}>Show All</option>
            <option value={2}>Hide UI</option>
            <option value={0}>Hide All</option>
          </select>
        </div>
      </div>

      {/* Base Image Color Scaling */}
      <div className={sectionClass}>
        <h4 className="text-sm font-semibold text-gray-200">Base Image</h4>
        <div>
          <label className={labelClass}>Colormap</label>
          <select
            className={selectClass}
            value={baseColormap.value}
            onChange={(e: Event) => { baseColormap.value = (e.target as HTMLSelectElement).value }}
          >
            {allColormaps.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className={labelClass}>Min</label>
            <input
              className={numberInputClass}
              type="number"
              step="any"
              value={baseCmin.value}
              onInput={(e: Event) => { baseCmin.value = parseFloat((e.target as HTMLInputElement).value) || 0 }}
            />
          </div>
          <div className="flex-1">
            <label className={labelClass}>Max</label>
            <input
              className={numberInputClass}
              type="number"
              step="any"
              value={baseCmax.value}
              onInput={(e: Event) => { baseCmax.value = parseFloat((e.target as HTMLInputElement).value) || 0 }}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Opacity</label>
          <input
            className={numberInputClass}
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={baseOpacity.value}
            onInput={(e: Event) => { baseOpacity.value = parseFloat((e.target as HTMLInputElement).value) || 0 }}
          />
        </div>
        <label className={checkboxRow}>
          <input type="checkbox" checked={baseInvert.value} onChange={() => { baseInvert.value = !baseInvert.value }} />
          Invert Colormap
        </label>
      </div>

      {/* Overlay Color Scaling */}
      <div className={sectionClass}>
        <h4 className="text-sm font-semibold text-gray-200">Overlay</h4>
        <div>
          <label className={labelClass}>Colormap</label>
          <select
            className={selectClass}
            value={overlayColormap.value}
            onChange={(e: Event) => { overlayColormap.value = (e.target as HTMLSelectElement).value }}
          >
            {allColormaps.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className={labelClass}>Min</label>
            <input
              className={numberInputClass}
              type="number"
              step="any"
              value={overlayCmin.value}
              onInput={(e: Event) => { overlayCmin.value = parseFloat((e.target as HTMLInputElement).value) || 0 }}
            />
          </div>
          <div className="flex-1">
            <label className={labelClass}>Max</label>
            <input
              className={numberInputClass}
              type="number"
              step="any"
              value={overlayCmax.value}
              onInput={(e: Event) => { overlayCmax.value = parseFloat((e.target as HTMLInputElement).value) || 0 }}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Opacity</label>
          <input
            className={numberInputClass}
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={overlayOpacity.value}
            onInput={(e: Event) => { overlayOpacity.value = parseFloat((e.target as HTMLInputElement).value) || 0 }}
          />
        </div>
        <label className={checkboxRow}>
          <input type="checkbox" checked={overlayInvert.value} onChange={() => { overlayInvert.value = !overlayInvert.value }} />
          Invert Colormap
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end border-t border-gray-600 pt-2">
        <button
          className="bg-gray-600 hover:bg-gray-500 rounded px-3 py-1 text-sm"
          onClick={() => { visible.value = false }}
        >
          Cancel
        </button>
        <button
          className="bg-blue-600 hover:bg-blue-500 rounded px-3 py-1 text-sm"
          onClick={handleSave}
        >
          {isEditing ? 'Update' : 'Save'}
        </button>
      </div>
    </div>
  )
}
