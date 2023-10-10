import { html } from 'htm/preact'
import { useRef } from 'preact/hooks'
import { NiiVueCanvas } from './NiiVueCanvas'
import { VolumeOverlay } from './VolumeOverlay'
import { useSignal } from '@preact/signals'

interface VolumeProps {
  name: string
  volumeIndex: number
  hideUI: number
  nv: Niivue
}

export const Volume = ({
  name,
  volumeIndex,
  hideUI,
  ...props
}: VolumeProps) => {
  const intensity = useSignal('')
  const volumeRef = useRef()
  const dispName = name.length > 20 ? `...${name.slice(-20)}` : name
  return html`
    <div class="volume" ref=${volumeRef}>
      ${hideUI > 0 && html`<div class="volume-name">${dispName}</div>`}
      <${NiiVueCanvas} ...${props} intensity=${intensity} />
      ${hideUI > 0 &&
      html`<div class="horizontal-layout volume-footer">
        ${hideUI > 1 &&
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
