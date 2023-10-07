import { SLICE_TYPE } from '@niivue/niivue'
import { html } from 'htm/preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import { listenToMessages } from '../events'
import { Container } from './Container'
import { Footer } from './Footer'
import { Header } from './Header'

export const App = () => {
  const props = initState()
  useEffect(() => listenToMessages(props.setNvArray, props.setSliceType), [])
  return html`
    <${Header} heightRef=${props.headerRef} nv=${props.nv0} />
    <${Container} ...${props} />
    <${Footer} ...${props} />
  `
}

function initState() {
  const headerRef = useRef()
  const footerRef = useRef()
  const [hideUI, setHideUI] = useState(2) // 0: hide all, 1: hide overlay, 2: show-all
  const [crosshair, setCrosshair] = useState(true)
  const [nvArray, setNvArray] = useState([])
  const [nv0, setNv0] = useState({ isLoaded: false })
  const [sliceType, setSliceType] = useState(SLICE_TYPE.MULTIPLANAR) // all views
  const [interpolation, setInterpolation] = useState(true)
  const [scaling, setScaling] = useState({ isManual: false, min: 0, max: 0 })
  const [location, setLocation] = useState('')
  return {
    headerRef,
    footerRef,
    hideUI,
    crosshair,
    nvArray,
    nv0,
    sliceType,
    interpolation,
    scaling,
    location,
    setNvArray,
    setNv0,
    setSliceType,
    setInterpolation,
    setScaling,
    setLocation,
    setHideUI,
    setCrosshair,
  }
}
