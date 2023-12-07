import { SLICE_TYPE } from '@niivue/niivue'
import { Signal, computed, useSignal } from '@preact/signals'
import { html } from 'htm/preact'
import { useEffect } from 'preact/hooks'
import { listenToMessages } from '../events'
import { Container } from './Container'
import { ImageDrop } from './ImageDrop'
import { HomeScreen } from './HomeScreen'
import { Menu } from './Menu'

export const App = () => {
  const isVscode = typeof vscode === 'object'
  const appProps = useAppState()
  useEffect(() => listenToMessages(appProps), [])

  const nImages = computed(() => appProps.nvArray.value.length)
  const showHomeScreen = computed(() => nImages.value == 0 && !isVscode)

  return html`
    <${ImageDrop}>
      <${Menu} ...${appProps} />
      ${showHomeScreen.value && html`<${HomeScreen} />`}
      <${Container} ...${appProps} />
      <div>${appProps.location}</div>
    <//>
  `
}
export interface AppProps {
  nvArray: Signal<Niivue[]>
  selection: Signal<Array<number>>
  selectionMode: Signal<number>
  nv0: Signal<Niivue>
  hideUI: Signal<number>
  crosshair: Signal<boolean>
  sliceType: Signal<number>
  interpolation: Signal<boolean>
  location: Signal<string>
  radiologicalConvention: Signal<boolean>
  colorbar: Signal<boolean>
}

export interface ScalingOpts {
  isManual: boolean
  min: number
  max: number
}

function useAppState(): AppProps {
  return {
    nvArray: useSignal<Niivue[]>([]),
    selection: useSignal<Array<number>>([]),
    selectionMode: useSignal(0),
    nv0: useSignal<Niivue>({ isLoaded: false }),
    hideUI: useSignal(3), // 0: hide all, 1: show name, 2: hide overlay, 3: show-all
    crosshair: useSignal(true),
    sliceType: useSignal<number>(SLICE_TYPE.MULTIPLANAR), // all views
    interpolation: useSignal(true),
    location: useSignal(''),
    radiologicalConvention: useSignal(false),
    colorbar: useSignal(false),
  }
}
