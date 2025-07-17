import { App } from '@niivue/react'
import { render } from 'preact'
import './index.css'
import { getSettings } from './settings'

const settings = getSettings()

render(<App settings={settings} />, document.getElementById('app')!)
