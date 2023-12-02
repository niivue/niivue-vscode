import { html } from 'htm/preact'
import { AppProps } from './App'
import { computed } from '@preact/signals'

export const Header = (props: AppProps) => {
  const { nv0 } = props
  const isLoaded = computed(() => nv0.value.isLoaded && nv0.value.volumes.length > 0)

  return html`
    <div class="flex flex-wrap items-baseline gap-1">
      ${isLoaded.value && html` <p>${getMetadataString(nv0.value)}</p> `}
    </div>
  `
}

export function getMetadataString(nv: Niivue) {
  const meta = nv?.volumes?.[0]?.getImageMetadata()
  if (!meta || !meta.nx) {
    return ''
  }
  const matrixString = 'matrix size: ' + meta.nx + ' x ' + meta.ny + ' x ' + meta.nz
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
