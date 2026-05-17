import { NVImage, SLICE_TYPE } from '@niivue/niivue'
import { NiiVueSettings } from './settings'

export interface ViewOptions {
  sliceType?: number
  hideUI?: number
  autoSizeMultiplanar?: boolean
  multiplanarForceRender?: boolean
  normalizeValues?: boolean
  graphOpacity?: number
}

export interface ColorScalingDefaults {
  colormap?: string
  opacity?: number
  cal_min?: number
  cal_max?: number
  colormapInvert?: boolean
}

export interface ViewPreset {
  name: string
  description: string
  settings: Partial<NiiVueSettings>
  viewOptions?: ViewOptions
  baseImageDefaults?: ColorScalingDefaults
  overlayDefaults?: ColorScalingDefaults
}

// Built-in presets with optimal viewing settings for different data types
export const BUILTIN_PRESETS: Record<string, ViewPreset> = {
  fmri: {
    name: 'fMRI',
    description: 'Optimized for functional MRI with 4D timeseries visualization',
    settings: {
      showCrosshairs: true,
      interpolation: true,
      colorbar: true,
      defaultOverlayColormap: 'redyell',
    },
    viewOptions: {
      sliceType: SLICE_TYPE.MULTIPLANAR,
      autoSizeMultiplanar: true,
      multiplanarForceRender: true,
      normalizeValues: false,
      graphOpacity: 1.0,
    },
  },
  phase: {
    name: 'Phase Data',
    description: 'Optimized for phase images with no interpolation and full range scaling',
    settings: {
      interpolation: false,
      colorbar: true,
      defaultVolumeColormap: 'hsv',
    },
    baseImageDefaults: {
      // Phase data typically ranges from -π to π or 0 to 2π
      // These will be applied if the data doesn't have explicit cal_min/cal_max
      cal_min: -Math.PI,
      cal_max: Math.PI,
    },
  },
  anatomical: {
    name: 'Anatomical',
    description: 'Standard settings for anatomical T1/T2 images',
    settings: {
      showCrosshairs: true,
      interpolation: true,
      colorbar: false,
      defaultVolumeColormap: 'gray',
    },
    viewOptions: {
      sliceType: SLICE_TYPE.MULTIPLANAR,
    },
  },
  dti: {
    name: 'DTI/Diffusion',
    description: 'Optimized for diffusion tensor imaging overlays',
    settings: {
      showCrosshairs: true,
      interpolation: true,
      colorbar: true,
      defaultOverlayColormap: 'jet',
    },
  },
}

// User presets stored in localStorage/VSCode settings
export interface UserPreset extends ViewPreset {
  id: string
  createdAt: string
  isDefault?: boolean
}

/**
 * Load user-defined presets from storage
 * In VSCode, presets come from settings; otherwise from localStorage
 */
export function loadUserPresets(): UserPreset[] {
  try {
    // Check if we're in VSCode environment
    const vscode = (globalThis as { vscode?: unknown }).vscode
    const key = vscode ? 'niivue_vscode_user_presets' : 'niivue_user_presets'
    const stored = localStorage.getItem(key)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    // Validate shape: must be an array of objects with required fields
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (p): p is UserPreset =>
        typeof p === 'object' && p !== null && typeof p.id === 'string' && typeof p.name === 'string',
    )
  } catch (e) {
    console.error('Failed to load user presets:', e)
    return []
  }
}

/**
 * Save user-defined presets to storage
 * In VSCode, save to a temporary location and notify extension
 * In standalone, save to localStorage
 */
export function saveUserPresets(presets: UserPreset[]): void {
  try {
    const vscode = (globalThis as { vscode?: unknown }).vscode
    if (vscode) {
      // For VSCode, store temporarily and notify user to save in settings
      localStorage.setItem('niivue_vscode_user_presets', JSON.stringify(presets))
      // Note: In VSCode, user should manually add to settings.json
      // We can't programmatically update VSCode settings from webview
    } else {
      localStorage.setItem('niivue_user_presets', JSON.stringify(presets))
    }
  } catch (e) {
    console.error('Failed to save user presets:', e)
  }
}

/**
 * Set VSCode user presets (called when receiving initSettings)
 */
export function setVSCodeUserPresets(presets: UserPreset[]): void {
  try {
    localStorage.setItem('niivue_vscode_user_presets', JSON.stringify(presets))
  } catch (e) {
    console.error('Failed to set VSCode user presets:', e)
  }
}

/**
 * Create a new user preset from current settings
 */
export function createUserPreset(
  name: string,
  description: string,
  settings: Partial<NiiVueSettings>,
  viewOptions?: ViewOptions,
  baseImageDefaults?: ColorScalingDefaults,
  overlayDefaults?: ColorScalingDefaults,
): UserPreset {
  return {
    id: `user_${Date.now()}`,
    name,
    description,
    settings,
    viewOptions,
    baseImageDefaults,
    overlayDefaults,
    createdAt: new Date().toISOString(),
  }
}

/**
 * Delete a user preset
 */
export function deleteUserPreset(id: string): void {
  const presets = loadUserPresets()
  const filtered = presets.filter((p) => p.id !== id)
  saveUserPresets(filtered)
}

export interface DefaultPresetRef {
  type: 'builtin' | 'user'
  id: string
}

const DEFAULT_PRESET_KEY = 'niivue_default_preset'

/**
 * Set any preset (builtin or user) as the default.
 * For builtin presets, id is the key in BUILTIN_PRESETS (e.g. 'fmri').
 * For user presets, id is the user preset id (e.g. 'user_123').
 */
export function setDefaultPreset(type: 'builtin' | 'user', id: string): void {
  try {
    localStorage.setItem(DEFAULT_PRESET_KEY, JSON.stringify({ type, id }))
  } catch (e) {
    console.error('Failed to save default preset:', e)
  }
}

/**
 * Clear the default preset
 */
export function clearDefaultPreset(): void {
  try {
    localStorage.removeItem(DEFAULT_PRESET_KEY)
  } catch (e) {
    console.error('Failed to clear default preset:', e)
  }
}

/**
 * Get the reference to the current default preset (type + id), if any
 */
export function getDefaultPresetRef(): DefaultPresetRef | null {
  try {
    const stored = localStorage.getItem(DEFAULT_PRESET_KEY)
    if (!stored) return null
    const ref = JSON.parse(stored) as DefaultPresetRef
    if (ref.type && ref.id) return ref
    return null
  } catch {
    return null
  }
}

/**
 * Get the default preset, if any (resolves builtin or user presets)
 */
export function getDefaultPreset(): ViewPreset | undefined {
  const ref = getDefaultPresetRef()
  if (!ref) return undefined
  if (ref.type === 'builtin') {
    return BUILTIN_PRESETS[ref.id]
  }
  const presets = loadUserPresets()
  return presets.find((p) => p.id === ref.id)
}

/**
 * Apply color scaling defaults to a single NiiVue volume object.
 * Note: colormap setter triggers calMinMax() which resets cal_min/cal_max,
 * so colormap must be set first, then cal_min/cal_max afterward.
 */
export function applyColorScalingToVolume(vol: NVImage, defaults: ColorScalingDefaults): void {
  if (defaults.colormap) {
    vol.colormap = defaults.colormap
  }
  if (defaults.cal_min !== undefined) {
    vol.cal_min = defaults.cal_min
  }
  if (defaults.cal_max !== undefined) {
    vol.cal_max = defaults.cal_max
  }
  if (defaults.opacity !== undefined) {
    vol.opacity = defaults.opacity
  }
  if (defaults.colormapInvert !== undefined) {
    vol.colormapInvert = defaults.colormapInvert
  }
}
