import { render } from 'preact'
import StreamlitViewer from './StreamlitViewer'
import './index.css'

const root = document.getElementById('root')
if (root) {
  // @ts-ignore - StreamlitViewer is wrapped with withStreamlitConnection which returns React types, but we're using Preact compat
  render(<StreamlitViewer />, root)
}
