import { useEffect, useState } from 'preact/hooks'
import preactLogo from './assets/preact.svg'
import viteLogo from '/vite.svg'
import './app.css'
import { html } from 'htm/preact'
import { Niivue } from '@niivue/niivue'

export function App() {
  const [count, setCount] = useState(0)

  let volumeList = [
    { url: 'https://niivue.github.io/niivue-demo-images/mni152.nii.gz' },
  ]
  useEffect(() => {
    const nv = new Niivue()
    nv.attachTo('gl') // attach to canvas with id="gl"
    nv.loadVolumes(volumeList)
  })

  return html`
    <div>
      <a href="https://vitejs.dev" target="_blank">
        <img src=${viteLogo} class="logo" alt="Vite logo" />
      </a>
      <a href="https://preactjs.com" target="_blank">
        <img src=${preactLogo} class="logo preact" alt="Preact logo" />
      </a>
    </div>
    <h1>Vite + Preact</h1>
    <canvas id="gl" width="200" height="200"></canvas>
    <div class="card">
      <button onClick=${() => setCount((count) => count + 1)}>
        count is ${count}
      </button>
      <p>Edit <code>src/app.tsx</code> and save to test HMR</p>
    </div>
    <p class="read-the-docs">
      Click on the Vite and Preact logos to learn more
    </p>
  `
}

export function sum(a: number, b: number) {
  return a + b
}
