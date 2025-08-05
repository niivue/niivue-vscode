import { useAppState } from '@niivue/react'
import { render } from 'preact'
import { registerSW } from 'virtual:pwa-register'
import { Pwa } from './Pwa'
import './index.css'
import { getSettings } from './settings'

const settings = getSettings()

// Register service worker for PWA updates
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New version available. Reload?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('Ready to work offline')
  },
})

function Main() {
  const appProps = useAppState(settings)
  return <Pwa appProps={appProps} />
}

render(<Main />, document.getElementById('app')!)
