import { SLICE_TYPE } from '@niivue/niivue'
import { Signal, computed, useSignal } from '@preact/signals'
import { html } from 'htm/preact'
import { useEffect } from 'preact/hooks'
import { listenToMessages, ExtendedNiivue } from '../events'
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
      <div class="pl-2">${appProps.location}</div>
    <//>
  `
}

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
}

export interface ScalingOpts {
  isManual: boolean
  min: number
  max: number
}

function useAppState(): AppProps {
  return {
    nvArray: useSignal<ExtendedNiivue[]>([]),
    selection: useSignal<Array<number>>([]),
    selectionMode: useSignal(SelectionMode.NONE),
    hideUI: useSignal(3), // 0: hide all, 1: show name, 2: hide overlay, 3: show-all
    sliceType: useSignal<number>(SLICE_TYPE.MULTIPLANAR), // all views
    location: useSignal(''),
  }
}
