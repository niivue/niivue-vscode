import { html } from 'htm/preact'
import { ShowHeaderButton } from './ShowHeaderButton'

export const Header = ({ nv, heightRef }) =>
  nv.isLoaded &&
  nv.volumes.length > 0 &&
  html`
    <div class="horizontal-layout" ref=${heightRef}>
      <${ShowHeaderButton} info=${nv.volumes[0].hdr.toFormattedString()} />
      <${MetaData} meta=${nv.volumes[0].getImageMetadata()} />
    </div>
  `

const MetaData = ({ meta }) => {
  if (!meta.nx) {
    return html``
  }
  const matrixString = `matrix size: ${meta.nx} x ${meta.ny} x ${meta.nz}`
  const voxelString = `voxelsize: ${meta.dx.toPrecision(
    2,
  )} x ${meta.dy.toPrecision(2)} x ${meta.dz.toPrecision(2)}`
  const timeString = meta.nt > 1 ? `, timepoints: ${meta.nt}` : ''
  return html`<p>${matrixString}, ${voxelString}${timeString}</p>`
}
