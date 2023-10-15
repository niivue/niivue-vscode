import { render } from 'preact'
import { html } from 'htm/preact'
import { App } from './components/App'

const app = document.getElementById('app')
if (app) {
  render(html`<${App} />`, app)
}

if ('launchQueue' in window) {
  const launchQueue = (window as any).launchQueue
  launchQueue.setConsumer(async (launchParams: any) => {
    const { files } = launchParams
    if (files.length > 0) {
      const fileHandle = files[0]
      const file = await fileHandle.getFile()
      const reader = new FileReader()
      reader.onload = function (event) {
        window.postMessage({
          type: 'addImage',
          body: {
            data: event.target!.result,
            uri: fileHandle.name,
          },
        })
      }
      reader.readAsArrayBuffer(file)
    }
  })
}