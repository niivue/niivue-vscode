import { html } from 'htm/preact'
import { useRef } from 'preact/hooks'
import { addOverlayEvent } from '../events'

interface ContextMenuProps {
  nv: Niivue
  volumeIndex: number
}

export const ContextMenu = ({ nv, volumeIndex }: ContextMenuProps) => {
  const contextMenu = useRef<HTMLDivElement>()
  const nVolumes = nv.volumes.length
  const nMeshes = nv.meshes.length
  const nMeshLayers = nMeshes > 0 ? nv.meshes[0].layers.length : 0
  const removeLastVolume = () => {
    nv.removeVolumeByIndex(nVolumes - 1)
    nv.updateGLVolume()
  }

  return html`
    <div
      class="absolute bg-gray-800 border border-gray-700 shadow-md z-10 left-6 bottom-4"
      ref=${contextMenu}
    >
      <div
        class="py-2 px-4 cursor-pointer"
        onclick=${() => addOverlayEvent(volumeIndex, 'overlay')}
      >
        Add
      </div>
      ${nVolumes > 1 &&
      html`
        <div class="py-2 px-4 cursor-pointer" onclick=${removeLastVolume}>
          Remove
        </div>
      `}
      ${nMeshes > 0 &&
      html`
        <div
          class="py-2 px-4 cursor-pointer"
          onclick=${() => addOverlayEvent(volumeIndex, 'addMeshCurvature')}
        >
          Add Mesh Curvature
        </div>
        <div
          class="py-2 px-4 cursor-pointer"
          onclick=${() => addOverlayEvent(volumeIndex, 'addMeshOverlay')}
        >
          Add Mesh Overlay
        </div>
        ${nMeshLayers > 0 &&
        html` <div
          class="py-2 px-4 cursor-pointer"
          onclick=${() => addOverlayEvent(volumeIndex, 'replaceMeshOverlay')}
        >
          Replace Mesh Overlay
        </div>`}
      `}
    </div>
  `
}
