import { render } from 'preact'
import { App } from './app.tsx'
import './index.css'
import { html } from 'htm/preact'

render(html`<${App} />`, document.getElementById('app')!)
