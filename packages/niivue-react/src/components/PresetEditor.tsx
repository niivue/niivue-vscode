import { SLICE_TYPE } from '@niivue/niivue'
import { Signal, useSignal } from '@preact/signals'
import { useMemo } from 'preact/hooks'
import { ColorScalingDefaults, UserPreset, ViewOptions, ViewPreset, getDefaultPresetRef } from '../presets'
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

/** Toggle icon for including/excluding a field from the preset */
const FieldToggle = ({ active, onClick }: { active: boolean; onClick: () => void }) => (
  <button
    className={`text-sm flex-shrink-0 w-4 text-center leading-none ${active ? 'text-blue-400' : 'text-gray-600'}`}
    onClick={(e: Event) => { e.preventDefault(); onClick() }}
    title={active ? 'Exclude from preset' : 'Include in preset'}
    type="button"
  >
    {active ? '●' : '○'}
  </button>
)

/** Wraps a field with an enable/disable toggle. Disabled fields are greyed out. */
const OptionalField = ({
  enabled,
  children,
  className = '',
}: {
  enabled: Signal<boolean>
  children: any
  className?: string
}) => (
  <div className={`flex items-center gap-1.5 ${className}`}>
    <FieldToggle active={enabled.value} onClick={() => { enabled.value = !enabled.value }} />
    <div className={`flex-1 min-w-0 ${enabled.value ? '' : 'opacity-30 pointer-events-none'}`}>
      {children}
    </div>
  </div>
)

/** Section header with a toggle-all button */
const SectionHeader = ({
  label,
  flags,
}: {
  label: string
  flags: Signal<boolean>[]
}) => {
  const anyActive = flags.some((f) => f.value)
  const toggleAll = () => {
    const allOn = flags.every((f) => f.value)
    flags.forEach((f) => { f.value = !allOn })
  }
  return (
    <div className="flex items-center gap-1.5">
      <FieldToggle active={anyActive} onClick={toggleAll} />
      <h4 className="text-sm font-semibold text-gray-200">{label}</h4>
    </div>
  )
}

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
  const isEditing = !!existingPreset
  const init = existingPreset as ViewPreset | undefined

  // Name & description
  const name = useSignal(init?.name ?? '')
  const description = useSignal(init?.description ?? '')
  const existingIsDefault = (() => {
    if (!existingPreset) return false
    const ref = getDefaultPresetRef()
    if (!ref) return false
    const userPreset = existingPreset as UserPreset
    return ref.type === 'user' && ref.id === userPreset.id
  })()
  const isDefault = useSignal(existingIsDefault)

  // --- Base image color scaling: values ---
  const baseColormap = useSignal(init?.baseImageDefaults?.colormap ?? currentBaseImage?.colormap ?? 'gray')
  const baseCmin = useSignal(init?.baseImageDefaults?.cal_min ?? currentBaseImage?.cal_min ?? 0)
  const baseCmax = useSignal(init?.baseImageDefaults?.cal_max ?? currentBaseImage?.cal_max ?? 1)
  const baseOpacity = useSignal(init?.baseImageDefaults?.opacity ?? currentBaseImage?.opacity ?? 1)
  const baseInvert = useSignal(init?.baseImageDefaults?.colormapInvert ?? currentBaseImage?.colormapInvert ?? false)

  // --- Base image: enabled flags (new preset = all off; editing = on only if saved) ---
  const eBaseColormap = useSignal(isEditing ? init?.baseImageDefaults?.colormap !== undefined : false)
  const eBaseMinMax = useSignal(isEditing
    ? (init?.baseImageDefaults?.cal_min !== undefined || init?.baseImageDefaults?.cal_max !== undefined)
    : false)
  const eBaseOpacity = useSignal(isEditing ? init?.baseImageDefaults?.opacity !== undefined : false)
  const eBaseInvert = useSignal(isEditing ? init?.baseImageDefaults?.colormapInvert !== undefined : false)
  const baseFlags = [eBaseColormap, eBaseMinMax, eBaseOpacity, eBaseInvert]

  // --- Overlay color scaling: values ---
  const overlayColormap = useSignal(init?.overlayDefaults?.colormap ?? currentOverlay?.colormap ?? 'redyell')
  const overlayCmin = useSignal(init?.overlayDefaults?.cal_min ?? currentOverlay?.cal_min ?? 0)
  const overlayCmax = useSignal(init?.overlayDefaults?.cal_max ?? currentOverlay?.cal_max ?? 1)
  const overlayOpacity = useSignal(init?.overlayDefaults?.opacity ?? currentOverlay?.opacity ?? 0.5)
  const overlayInvert = useSignal(init?.overlayDefaults?.colormapInvert ?? currentOverlay?.colormapInvert ?? false)

  // --- Overlay: enabled flags ---
  const eOverlayColormap = useSignal(isEditing ? init?.overlayDefaults?.colormap !== undefined : false)
  const eOverlayMinMax = useSignal(isEditing
    ? (init?.overlayDefaults?.cal_min !== undefined || init?.overlayDefaults?.cal_max !== undefined)
    : false)
  const eOverlayOpacity = useSignal(isEditing ? init?.overlayDefaults?.opacity !== undefined : false)
  const eOverlayInvert = useSignal(isEditing ? init?.overlayDefaults?.colormapInvert !== undefined : false)
  const overlayFlags = [eOverlayColormap, eOverlayMinMax, eOverlayOpacity, eOverlayInvert]

  // --- View settings: values ---
  const interpolation = useSignal(init?.settings.interpolation ?? currentSettings.interpolation)
  const showCrosshairs = useSignal(init?.settings.showCrosshairs ?? currentSettings.showCrosshairs)
  const radiologicalConvention = useSignal(init?.settings.radiologicalConvention ?? currentSettings.radiologicalConvention)
  const colorbar = useSignal(init?.settings.colorbar ?? currentSettings.colorbar)
  const zoomDragMode = useSignal(init?.settings.zoomDragMode ?? currentSettings.zoomDragMode)
  const sliceType = useSignal(init?.viewOptions?.sliceType ?? currentViewOptions.sliceType)
  const hideUI = useSignal(init?.viewOptions?.hideUI ?? currentViewOptions.hideUI)

  // --- View settings: enabled flags ---
  const eInterpolation = useSignal(isEditing ? init?.settings.interpolation !== undefined : false)
  const eCrosshairs = useSignal(isEditing ? init?.settings.showCrosshairs !== undefined : false)
  const eRadiological = useSignal(isEditing ? init?.settings.radiologicalConvention !== undefined : false)
  const eColorbar = useSignal(isEditing ? init?.settings.colorbar !== undefined : false)
  const eZoomDrag = useSignal(isEditing ? init?.settings.zoomDragMode !== undefined : false)
  const eSliceType = useSignal(isEditing ? init?.viewOptions?.sliceType !== undefined : false)
  const eHideUI = useSignal(isEditing ? init?.viewOptions?.hideUI !== undefined : false)
  const viewSettingsFlags = [eInterpolation, eCrosshairs, eRadiological, eColorbar, eZoomDrag, eSliceType, eHideUI]

  const allColormaps = useMemo(
    () => [...new Set([...COMMON_COLORMAPS, ...colormaps])],
    [colormaps],
  )

  const handleSave = () => {
    if (!name.value.trim()) {
      alert('Please enter a name for the preset')
      return
    }

    // Only include enabled base image defaults
    const baseDefs: ColorScalingDefaults = {}
    if (eBaseColormap.value) baseDefs.colormap = baseColormap.value
    if (eBaseMinMax.value) {
      baseDefs.cal_min = baseCmin.value
      baseDefs.cal_max = baseCmax.value
    }
    if (eBaseOpacity.value) baseDefs.opacity = baseOpacity.value
    if (eBaseInvert.value) baseDefs.colormapInvert = baseInvert.value
    const hasBase = Object.keys(baseDefs).length > 0

    // Only include enabled overlay defaults
    const overlayDefs: ColorScalingDefaults = {}
    if (eOverlayColormap.value) overlayDefs.colormap = overlayColormap.value
    if (eOverlayMinMax.value) {
      overlayDefs.cal_min = overlayCmin.value
      overlayDefs.cal_max = overlayCmax.value
    }
    if (eOverlayOpacity.value) overlayDefs.opacity = overlayOpacity.value
    if (eOverlayInvert.value) overlayDefs.colormapInvert = overlayInvert.value
    const hasOverlay = Object.keys(overlayDefs).length > 0

    // Only include enabled view settings
    const settingsObj: Partial<NiiVueSettings> = {}
    if (eInterpolation.value) settingsObj.interpolation = interpolation.value
    if (eCrosshairs.value) settingsObj.showCrosshairs = showCrosshairs.value
    if (eRadiological.value) settingsObj.radiologicalConvention = radiologicalConvention.value
    if (eColorbar.value) settingsObj.colorbar = colorbar.value
    if (eZoomDrag.value) settingsObj.zoomDragMode = zoomDragMode.value

    const viewOpts: ViewOptions = {}
    if (eSliceType.value) viewOpts.sliceType = sliceType.value
    if (eHideUI.value) viewOpts.hideUI = hideUI.value

    onSave({
      name: name.value.trim(),
      description: description.value || 'Custom user preset',
      settings: settingsObj,
      viewOptions: viewOpts,
      baseImageDefaults: hasBase ? baseDefs : undefined,
      overlayDefaults: hasOverlay ? overlayDefs : undefined,
      isDefault: isDefault.value,
      id: existingPreset?.id,
      createdAt: existingPreset?.createdAt,
    })
    visible.value = false
  }

  if (!visible.value) return null

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

      {/* Base Image Color Scaling */}
      <div className={sectionClass}>
        <SectionHeader label="Base Image" flags={baseFlags} />
        <OptionalField enabled={eBaseColormap}>
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
        </OptionalField>
        <OptionalField enabled={eBaseMinMax}>
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
        </OptionalField>
        <OptionalField enabled={eBaseOpacity}>
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
        </OptionalField>
        <OptionalField enabled={eBaseInvert}>
          <label className={checkboxRow}>
            <input type="checkbox" checked={baseInvert.value} onChange={() => { baseInvert.value = !baseInvert.value }} />
            Invert Colormap
          </label>
        </OptionalField>
      </div>

      {/* Overlay Color Scaling */}
      <div className={sectionClass}>
        <SectionHeader label="Overlay" flags={overlayFlags} />
        <OptionalField enabled={eOverlayColormap}>
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
        </OptionalField>
        <OptionalField enabled={eOverlayMinMax}>
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
        </OptionalField>
        <OptionalField enabled={eOverlayOpacity}>
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
        </OptionalField>
        <OptionalField enabled={eOverlayInvert}>
          <label className={checkboxRow}>
            <input type="checkbox" checked={overlayInvert.value} onChange={() => { overlayInvert.value = !overlayInvert.value }} />
            Invert Colormap
          </label>
        </OptionalField>
      </div>

      {/* View Settings (merged: settings + view options) */}
      <div className={sectionClass}>
        <SectionHeader label="View Settings" flags={viewSettingsFlags} />
        <OptionalField enabled={eInterpolation}>
          <label className={checkboxRow}>
            <input type="checkbox" checked={interpolation.value} onChange={() => { interpolation.value = !interpolation.value }} />
            Interpolation
          </label>
        </OptionalField>
        <OptionalField enabled={eCrosshairs}>
          <label className={checkboxRow}>
            <input type="checkbox" checked={showCrosshairs.value} onChange={() => { showCrosshairs.value = !showCrosshairs.value }} />
            Crosshairs
          </label>
        </OptionalField>
        <OptionalField enabled={eRadiological}>
          <label className={checkboxRow}>
            <input type="checkbox" checked={radiologicalConvention.value} onChange={() => { radiologicalConvention.value = !radiologicalConvention.value }} />
            Radiological Convention
          </label>
        </OptionalField>
        <OptionalField enabled={eColorbar}>
          <label className={checkboxRow}>
            <input type="checkbox" checked={colorbar.value} onChange={() => { colorbar.value = !colorbar.value }} />
            Colorbar
          </label>
        </OptionalField>
        <OptionalField enabled={eZoomDrag}>
          <label className={checkboxRow}>
            <input type="checkbox" checked={zoomDragMode.value} onChange={() => { zoomDragMode.value = !zoomDragMode.value }} />
            Zoom Drag Mode
          </label>
        </OptionalField>
        <OptionalField enabled={eSliceType}>
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
        </OptionalField>
        <OptionalField enabled={eHideUI}>
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
        </OptionalField>
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
