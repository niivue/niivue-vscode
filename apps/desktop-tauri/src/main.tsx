import { useAppState } from '@niivue/react'
import { render } from 'preact'
import { DesktopApp } from './components/DesktopApp'
import './index.css'
import { getSettings } from './settings'

const settings = getSettings()

function Main() {
  const appProps = useAppState(settings)
  return <DesktopApp appProps={appProps} />
}

render(<Main />, document.getElementById('app')!)
