import { useAppState } from '@niivue/react'
import { render } from 'preact'
import { Pwa } from './Pwa'
import './index.css'
import { getSettings } from './settings'

const settings = getSettings()

function Main() {
  const appProps = useAppState(settings)
  return <Pwa appProps={appProps} />
}

render(<Main />, document.getElementById('app')!)
