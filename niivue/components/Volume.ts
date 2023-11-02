import { html } from 'htm/preact'
import { useRef } from 'preact/hooks'
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
  const dispName = name.length > 20 ? `...${name.slice(-20)}` : name

  const handleDragStart = () => {
    // volumeRef.current!.style.zIndex = '1'
  }

  const handleDrag = () => {
    // volumeRef.current!.style.left = `${event.clientX}px`
    // volumeRef.current!.style.top = `${event.clientY}px`
  }

  const handleDragEnd = () => {
    volumeRef.current!.style.left = ''
    volumeRef.current!.style.top = ''
    volumeRef.current!.style.zIndex = ''
  }

  return html`
    <div
      class="volume"
      ref=${volumeRef}
      draggable="true"
      onDragStart=${handleDragStart}
      onDrag=${handleDrag}
      onDragEnd=${handleDragEnd}
    >
      ${hideUI.value > 0 && html` <div class="volume-name">${dispName}</div> `}
      ${hideUI.value > 1 &&
      html`
        <button class="volume-remove-button" onclick=${props.remove}>X</button>
        <button class="volume-drag-button"></button>
      `}
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
