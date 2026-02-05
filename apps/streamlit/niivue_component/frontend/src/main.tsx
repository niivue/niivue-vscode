import { render } from 'preact'
import StreamlitViewer from './StreamlitViewer'
import './index.css'

const root = document.getElementById('root')
if (root) {
  render(<StreamlitViewer />, root)
}
