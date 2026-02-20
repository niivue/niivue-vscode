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
