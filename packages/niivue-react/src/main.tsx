import { render } from 'preact'
import { App } from './components/App'
import { useAppState } from './components/AppProps'
import { addImageFromURLParams, handleMessage } from './events'
import './index.css'
import { readyStateManager } from './readyState'
import { defaultSettings } from './settings'

// Message queue for messages received before App is ready
let messageQueue: any[] = []
let appProps: any = null
let isAppReady = false

// Set up comprehensive message listener early
function setupMessageListener() {
  window.addEventListener('message', (e: any) => {
    const { type, body } = e.data

    if (type === 'initSettings') {
      const settings = body
      localStorage.setItem('userSettings', JSON.stringify(settings)) // Save settings to localStorage
      const app = document.getElementById('app')
      if (app) {
        render(<AppWithSettings settings={settings} />, app)
      }
    } else if (isAppReady && appProps) {
      // Forward message to app logic
      handleAppMessage(e.data, appProps)
    } else {
      // Queue message for later processing
      messageQueue.push(e.data)
    }
  })

  // Signal that event listener is ready
  readyStateManager.setEventListenerReady()
}

// Process queued messages when app becomes ready
function processQueuedMessages() {
  messageQueue.forEach((message) => {
    handleAppMessage(message, appProps)
  })
  messageQueue = []
}

// Handle app-specific messages (imported from events.ts logic)
function handleAppMessage(message: any, appProps: any) {
  return handleMessage(message, appProps)
}

function AppWithSettings({ settings }: { settings: any }) {
  const props = useAppState(settings)

  // Set app as ready and store props
  appProps = props
  isAppReady = true

  // Set up the full message listeners now that we have appProps
  setTimeout(() => {
    addImageFromURLParams()
    processQueuedMessages()
  }, 0)

  return <App appProps={props} />
}

// Set up the comprehensive message listener immediately
setupMessageListener()

window.addEventListener('DOMContentLoaded', () => {
  readyStateManager.setDomReady()
  const vscode = (window as any).vscode
  if (!vscode) {
    const savedSettings = localStorage.getItem('userSettings')
    const settings = savedSettings ? JSON.parse(savedSettings) : defaultSettings
    window.postMessage({
      type: 'initSettings',
      body: settings,
    })
  }
})
