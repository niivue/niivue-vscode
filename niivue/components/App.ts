import { SLICE_TYPE } from '@niivue/niivue'
import { useSignal } from '@preact/signals'
import { html } from 'htm/preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import { listenToMessages } from '../events'
import { Container, ContainerProps } from './Container'
import { Footer, FooterProps } from './Footer'
import { Header, HeaderProps } from './Header'

export const App = () => {
  const { headerProps, containerProps, footerProps, setNvArray, sliceType } =
    initState()
  useEffect(() => listenToMessages(setNvArray, sliceType), [])

  return html`
    <${Header} ...${headerProps} />
    <${Container} ...${containerProps} />
    <${Footer} ...${footerProps} />
  `
}

function initState() {
  const headerRef = useRef<HTMLDivElement>()
  const footerRef = useRef<HTMLDivElement>()
  const hideUI = useSignal(2) // 0: hide all, 1: hide overlay, 2: show-all
  const crosshair = useSignal(true)
  const [nvArray, setNvArray] = useState<Niivue[]>([])
  const [nv0, setNv0] = useState({ isLoaded: false })
  const sliceType = useSignal<number>(SLICE_TYPE.MULTIPLANAR) // all views
  const interpolation = useSignal(true)
  const [scaling, setScaling] = useState({ isManual: false, min: 0, max: 0 })
  const location = useSignal('')
  const radiologicalConvention = useSignal(false)

  const headerProps: HeaderProps = {
    heightRef: headerRef,
    nv: nv0,
  }

  const containerProps: ContainerProps = {
    nvArray,
    headerRef,
    footerRef,
    sliceType,
    hideUI,
    setNv0,
    interpolation,
    scaling,
    location,
    crosshair,
    radiologicalConvention,
  }

  const footerProps: FooterProps = {
    footerRef,
    sliceType,
    interpolation,
    setScaling,
    nv0,
    location,
    hideUI,
    crosshair,
    radiologicalConvention,
  }

  return { headerProps, containerProps, footerProps, setNvArray, sliceType }
}
