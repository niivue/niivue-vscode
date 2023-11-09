import { useState, MutableRef } from 'preact/hooks'
import { html } from 'htm/preact'
import { ContextMenu } from './ContextMenu'
import { OverlayOptions } from './OverlayOptions'
import { VolumeProps } from './Volume'

export const VolumeOverlay = ({
  nv,
  volumeIndex,
  volumeRef,
}: VolumeProps & { volumeRef: MutableRef<HTMLDivElement> }) => {
  const [isOpen, setIsOpen] = useState(false)
  const removeContextMenu = () => {
    setIsOpen(false)
    volumeRef.current.onclick = null
    volumeRef.current.oncontextmenu = null
  }
  const onContextmenu = (e: any) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOpen(true)
    volumeRef.current.onclick = removeContextMenu
    volumeRef.current.oncontextmenu = removeContextMenu
  }

  return html`
    <div class="pointer-events-auto">
      <span
        class="opacity-80 px-1 cursor-pointer volume-overlay"
        oncontextmenu=${onContextmenu}
        onclick=${onContextmenu}
        >Overlay</span
      >
      <${OverlayOptions} nv=${nv} />
      ${isOpen && html`<${ContextMenu} nv=${nv} volumeIndex=${volumeIndex} />`}
    </div>
  `
}
