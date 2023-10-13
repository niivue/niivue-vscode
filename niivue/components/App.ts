import { SLICE_TYPE } from '@niivue/niivue'
import { Signal, useSignal } from '@preact/signals'
import { html } from 'htm/preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import { listenToMessages } from '../events'
import { Container } from './Container'
import { Footer } from './Footer'
import { Header } from './Header'

export const App = () => {
  const { appProps, setNvArray } = initState()
  useEffect(() => listenToMessages(setNvArray, appProps.sliceType), [])

  return html`
    <${Header} ...${appProps} />
    <${Container} ...${appProps} />
    <${Footer} ...${appProps} />
  `
}

export interface AppProps {
  headerRef: any
  footerRef: any
  nvArray: Niivue[]
  nv0: Niivue
  setNv0: Function
  scaling: any
  setScaling: Function
  hideUI: Signal<number>
  crosshair: Signal<boolean>
  sliceType: Signal<number>
  interpolation: Signal<boolean>
  location: Signal<string>
  radiologicalConvention: Signal<boolean>
}

function initState() {
  const headerRef = useRef<HTMLDivElement>()
  const footerRef = useRef<HTMLDivElement>()
  const [nvArray, setNvArray] = useState<Niivue[]>([])
  const [nv0, setNv0] = useState({ isLoaded: false })
  const [scaling, setScaling] = useState({ isManual: false, min: 0, max: 0 })
  const hideUI = useSignal(2) // 0: hide all, 1: hide overlay, 2: show-all
  const crosshair = useSignal(true)
  const sliceType = useSignal<number>(SLICE_TYPE.MULTIPLANAR) // all views
  const interpolation = useSignal(true)
  const location = useSignal('')
  const radiologicalConvention = useSignal(false)

  const appProps: AppProps = {
    headerRef,
    footerRef,
    nvArray,
    nv0,
    setNv0,
    scaling,
    setScaling,
    hideUI,
    crosshair,
    sliceType,
    interpolation,
    location,
    radiologicalConvention,
  }

  return { appProps, setNvArray }
}
