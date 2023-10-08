import { useState, MutableRef } from 'preact/hooks'
import { html } from 'htm/preact'
import { ContextMenu } from './ContextMenu'
import { OverlayOptions } from './OverlayOptions'

interface VolumeOverlayProps {
  nv: Niivue
  volumeIndex: number
  volumeRef: MutableRef<HTMLDivElement>
}

export const VolumeOverlay = ({
  nv,
  volumeIndex,
  volumeRef,
}: VolumeOverlayProps) => {
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
    <span
      class="volume-overlay"
      title="Right Click"
      oncontextmenu=${onContextmenu}
      >Overlay</span
    >
    <${OverlayOptions} nv=${nv} />
    ${isOpen && html`<${ContextMenu} nv=${nv} volumeIndex=${volumeIndex} />`}
  `
}
