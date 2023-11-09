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
  width: number
  height: number
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

  return html`
    <div class="relative" ref=${volumeRef}>
      ${hideUI.value > 0 &&
      html`
        <div class="absolute pointer-events-none text-xl text-outline">
          ${dispName}
        </div>
      `}
      ${hideUI.value > 1 &&
      html`
        <button
          class="absolute bg-transparent text-xl cursor-pointer opacity-80 border-none text-outline top-0 right-0"
          onclick=${props.remove}
        >
          X
        </button>
      `}
      <${NiiVueCanvas} ...${props} intensity=${intensity} />
      ${hideUI.value > 1 &&
      html`<div class="horizontal-layout volume-footer text-outline">
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
