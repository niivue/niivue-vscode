import { html } from 'htm/preact'
import { SLICE_TYPE } from '@niivue/niivue'

interface SelectViewProps {
  sliceType: number
  setSliceType: Function
}

export const SelectView = ({
  sliceType,
  setSliceType,
}: SelectViewProps) => html`
  <select
    onchange=${(e: any) => setSliceType(parseInt(e.target.value))}
    value=${sliceType}
  >
    <option value=${SLICE_TYPE.AXIAL}>Axial</option>
    <option value=${SLICE_TYPE.CORONAL}>Coronal</option>
    <option value=${SLICE_TYPE.SAGITTAL}>Sagittal</option>
    <option value=${SLICE_TYPE.MULTIPLANAR}>Multiplanar</option>
    <option value=${SLICE_TYPE.RENDER}>Render</option>
  </select>
`
