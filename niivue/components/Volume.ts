import { html } from 'htm/preact'
import { useState, useRef } from 'preact/hooks'
import { NiiVueCanvas } from './NiiVueCanvas'
import { VolumeOverlay } from './VolumeOverlay'

export const Volume = ({ name, volumeIndex, hideUI, ...props }) => {
  const [intensity, setIntensity] = useState('')
  const volumeRef = useRef()
  const dispName = name.length > 20 ? `...${name.slice(-20)}` : name
  return html`
    <div class="volume" ref=${volumeRef}>
      ${hideUI > 0 && html`<div class="volume-name">${dispName}</div>`}
      <${NiiVueCanvas} ...${props} setIntensity=${setIntensity} />
      ${hideUI > 0 &&
      html`<div class="horizontal-layout volume-footer">
        ${hideUI > 1 &&
        html`<${VolumeOverlay}
          nv=${props.nv}
          volumeIndex=${volumeIndex}
          volumeRef=${volumeRef}
        />`}
        <span class="volume-intensity">${intensity}</span>
      </div>`}
    </div>
  `
}
