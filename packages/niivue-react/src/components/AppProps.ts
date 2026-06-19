import { SLICE_TYPE } from '@niivue/niivue'
import { Signal, useSignal } from '@preact/signals'
import { ExtendedNiivue } from '../events'
import { MenuItems, NiiVueSettings, defaultSettings } from '../settings'

export const enum SelectionMode {
  NONE,
  SINGLE,
  MULTIPLE,
}

export interface AppProps {
  nvArray: Signal<ExtendedNiivue[]>
  selection: Signal<Array<number>>
  selectionMode: Signal<SelectionMode>
  hideUI: Signal<number>
  sliceType: Signal<number>
  location: Signal<string>
  settings: Signal<NiiVueSettings>
  syncedIndices: Signal<Set<number>>
}

/**
 * Host-supplied build metadata for the brand menu's About dialog. Optional and
 * host-specific (e.g. the PWA injects its git hash at build time), so it is
 * passed as a prop rather than threaded through the persisted settings - a
 * version frozen into `localStorage` would go stale on the next deploy.
 */
export interface AppInfo {
  /** Short build/version identifier, e.g. a git short hash. */
  version?: string
  /** ISO build timestamp; rendered as a localized date. */
  buildDate?: string
  /** Source repository URL; used for the version's commit link. */
  repoUrl?: string
}

export interface ScalingOpts {
  isManual: boolean
  min: number
  max: number
}

export function useAppState(initialSettings: NiiVueSettings): AppProps {
  // Merge initialSettings with defaultSettings to ensure all required fields are present
  const mergedSettings: NiiVueSettings = {
    ...defaultSettings,
    ...initialSettings,
    menuItems: {
      ...defaultSettings.menuItems,
      ...initialSettings.menuItems,
    } as MenuItems,
  }
  
  return {
    nvArray: useSignal<ExtendedNiivue[]>([]),
    selection: useSignal<Array<number>>([]),
    selectionMode: useSignal(SelectionMode.NONE),
    hideUI: useSignal(3), // 0: hide all, 1: show name, 2: hide overlay, 3: show-all
    sliceType: useSignal<number>(SLICE_TYPE.MULTIPLANAR), // all views
    location: useSignal(''),
    settings: useSignal<NiiVueSettings>(mergedSettings),
    syncedIndices: useSignal<Set<number>>(new Set()),
  }
}
