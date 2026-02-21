/**
 * Keyboard shortcuts configuration for NiiVue
 * This file defines all keyboard shortcuts used across the NiiVue applications
 */

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  description: string
  isNiivueCore?: boolean // true if handled by niivue.js core library
}

/**
 * Keyboard shortcuts handled by niivue.js core library
 * These are already implemented in @niivue/niivue and cannot be changed
 */
export const NIIVUE_CORE_SHORTCUTS: Record<string, KeyboardShortcut> = {
  CYCLE_VIEW_MODE: {
    key: 'v',
    description: 'Cycle through view modes',
    isNiivueCore: true,
  },
  CYCLE_CLIP_PLANE: {
    key: 'c',
    description: 'Cycle through clip plane orientations in 3D',
    isNiivueCore: true,
  },
  VOLUME_NEXT: {
    key: 'ArrowRight',
    description: 'Next volume in 4D images',
    isNiivueCore: true,
  },
  VOLUME_PREV: {
    key: 'ArrowLeft',
    description: 'Previous volume in 4D images',
    isNiivueCore: true,
  },
  CROSSHAIR_RIGHT: {
    key: 'l',
    description: 'Move crosshair right',
    isNiivueCore: true,
  },
  CROSSHAIR_LEFT: {
    key: 'h',
    description: 'Move crosshair left',
    isNiivueCore: true,
  },
  CROSSHAIR_ANTERIOR: {
    key: 'k',
    description: 'Move crosshair anterior',
    isNiivueCore: true,
  },
  CROSSHAIR_POSTERIOR: {
    key: 'j',
    description: 'Move crosshair posterior',
    isNiivueCore: true,
  },
  CROSSHAIR_SUPERIOR: {
    key: 'u',
    ctrl: true,
    description: 'Move crosshair superior',
    isNiivueCore: true,
  },
  CROSSHAIR_INFERIOR: {
    key: 'd',
    ctrl: true,
    description: 'Move crosshair inferior',
    isNiivueCore: true,
  },
}

/**
 * UI-specific keyboard shortcuts for menu items and actions
 * These shortcuts can be customized by the user in VSCode settings
 */
export const UI_SHORTCUTS: Record<string, KeyboardShortcut> = {
  VIEW_AXIAL: {
    key: '1',
    description: 'Axial view',
  },
  VIEW_SAGITTAL: {
    key: '2',
    description: 'Sagittal view',
  },
  VIEW_CORONAL: {
    key: '3',
    description: 'Coronal view',
  },
  VIEW_RENDER: {
    key: '4',
    description: 'Render view',
  },
  VIEW_MULTIPLANAR: {
    key: '5',
    description: 'Multiplanar + Render view',
  },
  VIEW_MULTIPLANAR_TIMESERIES: {
    key: '6',
    description: 'Multiplanar + Timeseries view',
  },
  RESET_VIEW: {
    key: 'r',
    description: 'Reset view/zoom',
  },
  TOGGLE_INTERPOLATION: {
    key: 'i',
    description: 'Toggle interpolation',
  },
  TOGGLE_COLORBAR: {
    key: 'b',
    description: 'Toggle colorbar',
  },
  TOGGLE_RADIOLOGICAL: {
    key: 'x',
    description: 'Toggle radiological convention',
  },
  TOGGLE_CROSSHAIR: {
    key: 'm',
    description: 'Toggle crosshair',
  },
  TOGGLE_ZOOM_MODE: {
    key: 'z',
    description: 'Toggle zoom drag mode',
  },
  ADD_IMAGE: {
    key: 'o',
    ctrl: true,
    description: 'Add image',
  },
  ADD_OVERLAY: {
    key: 'l',
    ctrl: true,
    description: 'Add overlay',
  },
  COLORSCALE: {
    key: 's',
    description: 'Open colorscale menu',
  },
  HIDE_UI: {
    key: 'u',
    description: 'Toggle UI visibility',
  },
  SHOW_HEADER: {
    key: 'h',
    ctrl: true,
    description: 'Show header information',
  },
  CROSSHAIR_SUPERIOR: {
    key: 'u',
    shift: true,
    description: 'Move crosshair superior (alternate)',
  },
  CROSSHAIR_INFERIOR: {
    key: 'd',
    shift: true,
    description: 'Move crosshair inferior (alternate)',
  },
}

/**
 * Format keyboard shortcut for display
 * @param shortcut - The keyboard shortcut configuration
 * @returns Formatted string like "Ctrl+O" or "V"
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = []

  if (shortcut.ctrl) parts.push('Ctrl')
  if (shortcut.shift) parts.push('Shift')
  if (shortcut.alt) parts.push('Alt')

  // Format special keys
  let key = shortcut.key
  if (key.startsWith('Arrow')) {
    key = key.replace('Arrow', '')
  }

  // Capitalize single letters
  if (key.length === 1) {
    key = key.toUpperCase()
  }

  parts.push(key)

  return parts.join('+')
}

/**
 * Check if a keyboard event matches a shortcut
 * @param event - The keyboard event
 * @param shortcut - The keyboard shortcut configuration
 * @returns true if the event matches the shortcut
 */
export function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()
  const ctrlMatches = !!shortcut.ctrl === (event.ctrlKey || event.metaKey)
  const shiftMatches = !!shortcut.shift === event.shiftKey
  const altMatches = !!shortcut.alt === event.altKey

  return keyMatches && ctrlMatches && shiftMatches && altMatches
}

/**
 * Get all shortcuts combined
 */
export const ALL_SHORTCUTS = {
  ...NIIVUE_CORE_SHORTCUTS,
  ...UI_SHORTCUTS,
}
