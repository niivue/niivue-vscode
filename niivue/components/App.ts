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
  nv0: Signal<Niivue>
  scaling: Signal<any>
  hideUI: Signal<number>
  crosshair: Signal<boolean>
  sliceType: Signal<number>
  interpolation: Signal<boolean>
  location: Signal<string>
  radiologicalConvention: Signal<boolean>
}

export interface ScalingOpts {
  isManual: boolean
  min: number
  max: number
}

function initState() {
  const headerRef = useRef<HTMLDivElement>()
  const footerRef = useRef<HTMLDivElement>()
  const [nvArray, setNvArray] = useState<Niivue[]>([])
  const nv0 = useSignal<Niivue>({ isLoaded: false })
  const scaling = useSignal<ScalingOpts>({ isManual: false, min: 0, max: 0 })
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
    scaling,
    hideUI,
    crosshair,
    sliceType,
    interpolation,
    location,
    radiologicalConvention,
  }

  return { appProps, setNvArray }
}
