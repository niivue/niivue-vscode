import { html } from 'htm/preact'
import { ShowHeaderButton } from './ShowHeaderButton'
import { AppProps } from './App'
import { computed } from '@preact/signals'

export const Header = (props: AppProps & { homeButton: boolean }) => {
  const { nv0, homeButton } = props
  const isLoaded = computed(
    () => nv0.value.isLoaded && nv0.value.volumes.length > 0,
  )

  return html`
    <div class="flex flex-wrap items-baseline gap-1">
      ${homeButton &&
      html`<button onClick=${() => location.reload()}>Home</button>`}
      ${isLoaded.value &&
      html`
        <${ShowHeaderButton}
          info=${nv0.value.volumes[0].hdr.toFormattedString()}
        />
        <p>${getMetadataString(nv0.value)}</p>
      `}
    </div>
  `
}

function getMetadataString(nv: Niivue) {
  const meta = nv?.volumes?.[0]?.getImageMetadata()
  if (!meta || !meta.nx) {
    return ''
  }
  const matrixString =
    'matrix size: ' + meta.nx + ' x ' + meta.ny + ' x ' + meta.nz
  const voxelString =
    'voxelsize: ' +
    meta.dx.toPrecision(2) +
    ' x ' +
    meta.dy.toPrecision(2) +
    ' x ' +
    meta.dz.toPrecision(2)
  const timeString = meta.nt > 1 ? ', timepoints: ' + meta.nt : ''
  return matrixString + ', ' + voxelString + timeString
}
