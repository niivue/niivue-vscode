import { SLICE_TYPE } from '@niivue/niivue'
import { NiiVueSettings } from './settings'

export interface ViewOptions {
  sliceType?: number
  hideUI?: number
  autoSizeMultiplanar?: boolean
  multiplanarForceRender?: boolean
  normalizeValues?: boolean
  graphOpacity?: number
}

export interface OverlayDefaults {
  colormap?: string
  opacity?: number
  cal_min?: number
  cal_max?: number
}

export interface ViewPreset {
  name: string
  description: string
  settings: Partial<NiiVueSettings>
  viewOptions?: ViewOptions
  overlayDefaults?: OverlayDefaults
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
    overlayDefaults: {
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
}

/**
 * Load user-defined presets from storage
 * In VSCode, presets come from settings; otherwise from localStorage
 */
export function loadUserPresets(): UserPreset[] {
  try {
    // Check if we're in VSCode environment
    const vscode = (globalThis as any).vscode
    if (vscode) {
      // VSCode presets are passed via initSettings message
      // They will be loaded separately through the settings flow
      const stored = localStorage.getItem('niivue_vscode_user_presets')
      return stored ? JSON.parse(stored) : []
    } else {
      const stored = localStorage.getItem('niivue_user_presets')
      return stored ? JSON.parse(stored) : []
    }
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
    const vscode = (globalThis as any).vscode
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
  overlayDefaults?: OverlayDefaults,
): UserPreset {
  return {
    id: `user_${Date.now()}`,
    name,
    description,
    settings,
    viewOptions,
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
