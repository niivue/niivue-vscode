import { html } from 'htm/preact'
import { useRef } from 'preact/hooks'
import { addOverlayEvent } from '../events'

export const ContextMenu = ({ nv, volumeIndex }) => {
  const contextMenu = useRef()
  const nVolumes = nv.volumes.length
  const nMeshes = nv.meshes.length
  const nMeshLayers = nMeshes > 0 ? nv.meshes[0].layers.length : 0
  const removeLastVolume = () => {
    nv.removeVolumeByIndex(nVolumes - 1)
    nv.updateGLVolume()
  }
  return html`
    <div
      class="context-menu"
      ref=${contextMenu}
      style=${`left: 30px; bottom: 20px;`}
    >
      <div
        class="context-menu-item"
        onclick=${() => addOverlayEvent(volumeIndex, 'overlay')}
      >
        Add
      </div>
      ${nVolumes > 1 &&
      html`<div class="context-menu-item" onclick=${removeLastVolume}>
        Remove
      </div>`}
      ${nMeshes > 0 &&
      html`
        <div
          class="context-menu-item"
          onclick=${() => addOverlayEvent(volumeIndex, 'addMeshCurvature')}
        >
          Add Mesh Curvature
        </div>
        <div
          class="context-menu-item"
          onclick=${() => addOverlayEvent(volumeIndex, 'addMeshOverlay')}
        >
          Add Mesh Overlay
        </div>
        ${nMeshLayers > 0 &&
        html`<div
          class="context-menu-item"
          onclick=${() => addOverlayEvent(volumeIndex, 'replaceMeshOverlay')}
        >
          Replace Mesh Overlay
        </div>`}
      `}
    </div>
  `
}
