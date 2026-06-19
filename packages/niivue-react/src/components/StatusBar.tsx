import '../styles/tokens.css'
import './StatusBar.css'
import { computed } from '@preact/signals'
import { AppProps, SelectionMode } from './AppProps'
import { getMetadataString, getNumberOfPoints } from '../utility'

// A single compact status strip at the bottom of every host. It merges what
// used to be two separate rows: the image metadata (matrix/voxel size, formerly
// rendered under the top bar) on the left, and the crosshair location readout
// (formerly a standalone footer) on the right. Folding them into one slim row
// reclaims vertical space and gives the readout a consistent home across the
// vscode/pwa/desktop/streamlit hosts.
export const StatusBar = (props: AppProps) => {
  const { nvArray, selection, selectionMode, location } = props

  // Mirror Menu's selection logic so the metadata tracks the same canvas the
  // menu acts on (last/selected), not always the first.
  const nvArraySelected = computed(() =>
    selectionMode.value != SelectionMode.NONE && selection.value.length > 0
      ? nvArray.value.filter((_, i) => selection.value.includes(i))
      : nvArray.value,
  )

  const meta = computed(() => {
    const nv = nvArraySelected.value[0]
    if (nv?.volumes?.length > 0) return getMetadataString(nv)
    if (nv?.meshes?.length > 0) return getNumberOfPoints(nv)
    return ''
  })

  return (
    <div className="nv-statusbar">
      <span className="nv-status-meta">{meta.value}</span>
      <span className="nv-status-loc">{location?.value || ''}</span>
    </div>
  )
}
