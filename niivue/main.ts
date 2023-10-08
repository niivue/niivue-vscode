import { render } from 'preact'
import { html } from 'htm/preact'
import { App } from './components/App'

const app = document.getElementById('app')
if (app) {
  render(html`<${App} />`, app)
}
