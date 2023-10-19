import { html } from 'htm/preact'
import { useRef, useState } from 'preact/hooks'
import { NiiVueCanvas } from './NiiVueCanvas'
import { VolumeOverlay } from './VolumeOverlay'
import { useSignal } from '@preact/signals'
import { AppProps } from './App'

export interface VolumeProps {
  name: string
  volumeIndex: number
  nv: Niivue
  remove: Function
}

export const Volume = ({
  name,
  volumeIndex,
  hideUI,
  ...props
}: AppProps & VolumeProps) => {
  const intensity = useSignal('')
  const volumeRef = useRef<HTMLDivElement>()
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const dispName = name.length > 20 ? `...${name.slice(-20)}` : name

  const handleMouseDown = (event: MouseEvent) => {
    volumeRef.current!.style.zIndex = '1'
    setIsDragging(true)
    setDragStart({ x: event.clientX, y: event.clientY })
    setDragOffset({ x: 0, y: 0 })
  }

  const handleMouseMove = (event: MouseEvent) => {
    if (isDragging) {
      const dx = event.clientX - dragStart.x
      const dy = event.clientY - dragStart.y
      volumeRef.current!.style.left = `${dragOffset.x + dx}px`
      volumeRef.current!.style.top = `${dragOffset.y + dy}px`
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    volumeRef.current!.style.left = ''
    volumeRef.current!.style.top = ''
    volumeRef.current!.style.zIndex = ''
  }

  return html`
    <div
      class="volume"
      ref=${volumeRef}
      onMouseDown=${handleMouseDown}
      onMouseMove=${handleMouseMove}
      onMouseUp=${handleMouseUp}
    >
      ${hideUI.value > 0 && html`<div class="volume-name">${dispName}</div>`}
      ${hideUI.value > 0 &&
      html`<button class="volume-remove-button" onclick=${props.remove}>
        X
      </button>`}
      <${NiiVueCanvas} ...${props} intensity=${intensity} />
      ${hideUI.value > 1 &&
      html`<div class="horizontal-layout volume-footer">
        ${hideUI.value > 2 &&
        html`<${VolumeOverlay}
          nv=${props.nv}
          volumeIndex=${volumeIndex}
          volumeRef=${volumeRef}
        />`}
        <span>${intensity}</span>
      </div>`}
    </div>
  `
}