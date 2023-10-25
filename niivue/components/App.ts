import { SLICE_TYPE } from '@niivue/niivue'
import { Signal, computed, useSignal } from '@preact/signals'
import { html } from 'htm/preact'
import { useEffect, useRef } from 'preact/hooks'
import { listenToMessages } from '../events'
import { Container } from './Container'
import { Footer } from './Footer'
import { Header } from './Header'
import { ImageDrop } from './ImageDrop'
import { HomeScreen } from './HomeScreen'

export const App = () => {
  const isVscode = typeof vscode === 'object'
  const appProps = initState()
  useEffect(() => listenToMessages(appProps), [])

  const nImages = computed(() => appProps.nvArray.value.length)
  const showHomeScreen = computed(() => nImages.value == 0 && !isVscode)

  return html`
    <${ImageDrop} box=${showHomeScreen.value}>
      <${Header} ...${appProps} homeButton=${showHomeScreen.value} />
      <${Container} ...${appProps} />
      <${Footer} ...${appProps} />
      ${showHomeScreen.value && html`<${HomeScreen} />`}
    <//>
  `
}
export interface AppProps {
  headerRef: any
  footerRef: any
  nvArray: Signal<Niivue[]>
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

function initState(): AppProps {
  return {
    headerRef: useRef<HTMLDivElement>(),
    footerRef: useRef<HTMLDivElement>(),
    nvArray: useSignal<Niivue[]>([]),
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
