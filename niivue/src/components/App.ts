import { SLICE_TYPE } from '@niivue/niivue'
import { Signal, computed, useSignal } from '@preact/signals'
import { html } from 'htm/preact'
import { useEffect } from 'preact/hooks'
import { listenToMessages } from '../events'
import { Container } from './Container'
import { Footer } from './Footer'
import { Header } from './Header'
import { ImageDrop } from './ImageDrop'
import { HomeScreen } from './HomeScreen'
import { Menu } from './Menu'

export const App = () => {
  const isVscode = typeof vscode === 'object'
  const appProps = useAppState()
  useEffect(() => listenToMessages(appProps), [])

  const nImages = computed(() => appProps.nvArray.value.length)
  const showHomeScreen = computed(() => nImages.value == 0 && !isVscode)
  const showHomeButton = computed(() => nImages.value > 0 && !isVscode)

  return html`
    <${Menu} ...${appProps} />
    <${ImageDrop}>
      ${showHomeScreen.value && html`<${HomeScreen} />`}
      <${Header} ...${appProps} homeButton=${showHomeButton.value} />
      <${Container} ...${appProps} />
      <${Footer} ...${appProps} />
    <//>
  `
}
export interface AppProps {
  nvArray: Signal<Niivue[]>
  selection: Signal<Array<number>>
  selectionActive: Signal<boolean>
  nv0: Signal<Niivue>
  scaling: Signal<any>
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
    selectionActive: useSignal(false),
    nv0: useSignal<Niivue>({ isLoaded: false }),
    scaling: useSignal<ScalingOpts>({ isManual: false, min: 0, max: 0 }),
    hideUI: useSignal(3), // 0: hide all, 1: show name, 2: hide overlay, 3: show-all
    crosshair: useSignal(true),
    sliceType: useSignal<number>(SLICE_TYPE.MULTIPLANAR), // all views
    interpolation: useSignal(true),
    location: useSignal(''),
    radiologicalConvention: useSignal(false),
    colorbar: useSignal(false),
  }
}
