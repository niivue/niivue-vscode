import { render } from 'preact'
import { App } from './components/App'
import { useAppState } from './components/AppProps'
import './index.css'
import { defaultSettings } from './settings'

function AppWithSettings({ settings }: { settings: any }) {
  const appProps = useAppState(settings)
  return <App appProps={appProps} />
}

window.addEventListener('message', (e: any) => {
  const { type, body } = e.data
  if (type === 'initSettings') {
    const settings = body
    localStorage.setItem('userSettings', JSON.stringify(settings)) // Save settings to localStorage
    const app = document.getElementById('app')
    if (app) {
      render(<AppWithSettings settings={settings} />, app)
    }
  }
})

window.addEventListener('DOMContentLoaded', () => {
  const vscode = (window as any).vscode
  if (vscode) {
    vscode.postMessage({ type: 'ready' })
  } else {
    const savedSettings = localStorage.getItem('userSettings')
    const settings = savedSettings ? JSON.parse(savedSettings) : defaultSettings
    window.postMessage({
      type: 'initSettings',
      body: settings,
    })
  }
})

function addLaunchQueueImages() {
  if ('launchQueue' in window) {
    const launchQueue = (window as any).launchQueue
    launchQueue.setConsumer(async (launchParams: any) => {
      const { files } = launchParams
      if (files.length > 0) {
        window.postMessage({
          type: 'initCanvas',
          body: files.length,
        })
        for (const file of files) {
          const blob = await file.getFile()
          const reader = new FileReader()
          reader.onload = () => {
            window.postMessage({
              type: 'addImage',
              body: {
                data: reader.result,
                uri: file.name,
              },
            })
          }
          reader.readAsArrayBuffer(blob)
        }
      }
    })
  }
}

document.addEventListener('AppReady', () => {
  addLaunchQueueImages()
})
