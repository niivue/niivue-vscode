import { SLICE_TYPE } from '@niivue/niivue'
import { useSignal } from '@preact/signals'
import { html } from 'htm/preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import { listenToMessages } from '../events'
import { Container, ContainerProps } from './Container'
import { Footer, FooterProps } from './Footer'
import { Header, HeaderProps } from './Header'
import { ImageDrop } from './ImageDrop'

export const App = () => {
  const { headerProps, containerProps, footerProps, setNvArray, setSliceType } =
    initState()
  useEffect(() => listenToMessages(setNvArray, setSliceType), [])
  return html`
    <${Header} ...${headerProps} />
    <${containerProps.nvArray.length == 0 && html`${ImageDrop}`} />
    <${Container} ...${containerProps} />
    <${Footer} ...${footerProps} />
  `
}

function initState() {
  const headerRef = useRef<HTMLDivElement>()
  const footerRef = useRef<HTMLDivElement>()
  const [hideUI, setHideUI] = useState(2) // 0: hide all, 1: hide overlay, 2: show-all
  const [crosshair, setCrosshair] = useState(true)
  const [nvArray, setNvArray] = useState<Niivue[]>([])
  const [nv0, setNv0] = useState({ isLoaded: false })
  const [sliceType, setSliceType] = useState<number>(SLICE_TYPE.MULTIPLANAR) // all views
  const [interpolation, setInterpolation] = useState(true)
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
    setSliceType,
    interpolation,
    setInterpolation,
    setScaling,
    nv0,
    location,
    setHideUI,
    setCrosshair,
    radiologicalConvention,
  }

  return { headerProps, containerProps, footerProps, setNvArray, setSliceType }
}
