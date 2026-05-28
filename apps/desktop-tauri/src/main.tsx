import { defaultSettings, useAppState } from '@niivue/react'
import { render } from 'preact'
import { DesktopApp } from './components/DesktopApp'
import './index.css'

function Main() {
  const appProps = useAppState(defaultSettings)
  return <DesktopApp appProps={appProps} />
}

render(<Main />, document.getElementById('app')!)
