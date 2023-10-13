import { html } from 'htm/preact'
import { SLICE_TYPE } from '@niivue/niivue'
import { Signal } from '@preact/signals'

interface SelectViewProps {
  sliceType: Signal<number>
  setSliceType: Function
}

export const SelectView = ({ sliceType }: SelectViewProps) => html`
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
