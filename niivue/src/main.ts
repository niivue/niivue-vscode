import './index.css'
import { render } from 'preact'
import { html } from 'htm/preact'
import { App } from './components/App'

const app = document.getElementById('app')
if (app) {
  render(html`<${App} settings=${getInitSettings()} />`, app)
}

function getInitSettings() {
  return {
    showCrosshairs: false,
  }
}

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
