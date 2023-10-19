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
  const volumeRef = useRef()
  const dispName = name.length > 20 ? `...${name.slice(-20)}` : name
  return html`
    <div class="volume" ref=${volumeRef}>
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
