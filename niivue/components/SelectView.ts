import { html } from 'htm/preact'
import { SLICE_TYPE } from '@niivue/niivue'
import { AppProps } from './App'

export const SelectView = ({ sliceType }: AppProps) => html`
  <select
    onchange=${(e: any) => (sliceType.value = parseInt(e.target.value))}
    value=${sliceType}
  >
    <option value=${SLICE_TYPE.AXIAL}>Axial</option>
    <option value=${SLICE_TYPE.CORONAL}>Coronal</option>
    <option value=${SLICE_TYPE.SAGITTAL}>Sagittal</option>
    <option value=${SLICE_TYPE.MULTIPLANAR}>Multiplanar</option>
    <option value=${SLICE_TYPE.RENDER}>Render</option>
  </select>
`
