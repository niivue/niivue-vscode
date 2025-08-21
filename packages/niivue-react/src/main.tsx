import { render } from 'preact'
import { App } from './components/App'
import { useAppState } from './components/AppProps'
import './index.css'
import { defaultSettings } from './settings'
import { readyStateManager } from './readyState'
import { handleMessage, addImageFromURLParams } from './events'

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
  messageQueue.forEach(message => {
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
