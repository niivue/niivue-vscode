import { html } from 'htm/preact'
import { useRef } from 'preact/hooks'
import { NiiVueCanvas } from './NiiVueCanvas'
import { VolumeOverlay } from './VolumeOverlay'
import { computed, useSignal } from '@preact/signals'
import { AppProps } from './App'

export interface VolumeProps {
  name: string
  volumeIndex: number
  nv: Niivue
  remove: Function
  width: number
  height: number
}

export const Volume = (props: AppProps & VolumeProps) => {
  const { name, volumeIndex, hideUI, selection, selectionActive } = props
  const intensity = useSignal('')
  const volumeRef = useRef<HTMLDivElement>()
  const dispName = name.length > 20 ? `...${name.slice(-20)}` : name
  const selected = computed(() => selection.value.includes(volumeIndex))

  // it would maybe need a invisible box over the volume to prevent the click event, stopPropagation and preventDefault don't work
  const selectClick = selectionActive.value
    ? () => {
        if (selected.value) {
          selection.value = selection.value.filter((i) => i != volumeIndex)
        } else {
          selection.value = [...selection.value, volumeIndex]
        }
      }
    : () => {}

  return html`
    <div
      class="relative ${selectionActive.value && selected.value ? 'outline outline-blue-500' : ''}"
      ref=${volumeRef}
      onclick=${selectClick}
    >
      ${hideUI.value > 0 &&
      html`
        <div class="absolute pointer-events-none text-xl text-outline left-1">${dispName}</div>
      `}
      ${hideUI.value > 2 &&
      html`
        <button
          class="absolute bg-transparent text-xl cursor-pointer opacity-80 border-none text-outline top-0 right-1"
          onclick=${props.remove}
        >
          X
        </button>
      `}
      <${NiiVueCanvas} ...${props} intensity=${intensity} />
      ${hideUI.value > 1 &&
      html`<div class="pointer-events-none absolute bottom-1 left-1">
        <span class="text-outline">${intensity}</span>
      </div>`}
    </div>
  `
}
