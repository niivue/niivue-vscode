import { html } from 'htm/preact'
import { useEffect } from 'preact/hooks'
import { NiiVueCanvas } from './NiiVueCanvas'
import { computed, useSignal, Signal } from '@preact/signals'
import { AppProps, SelectionMode } from './App'
import { ExtendedNiivue } from '../events'

export interface VolumeProps {
  name: string
  volumeIndex: number
  nv: ExtendedNiivue
  remove: Function
  width: number
  height: number
}

export const Volume = (props: AppProps & VolumeProps) => {
  const { name, volumeIndex, hideUI, selection, selectionMode, nv, location } = props
  const intensity = useSignal('')
  const location_local = useSignal('')
  const vol4D = useSignal(0)
  const dispName = name.length > 20 ? `...${name.slice(-20)}` : name
  const selected = computed(() => selection.value.includes(volumeIndex))
  const tooltipVisible = useSignal(false)
  const tooltipPos = useSignal({ x: 0, y: 0 })

  useEffect(() => {
    nv.onLocationChange = (data: any) =>
      setIntensityAndLocation(
        data,
        intensity,
        location_local,
        location,
        volumeIndex == selection.value[0],
      )
  }, [selection.value])

  // Mouse listeners for updating tooltip position and visibility
  useEffect(() => {
    const updateTooltipPosition = (e: MouseEvent) => {
      tooltipPos.value = { x: e.clientX + 10, y: e.clientY + 10 }
    }
    const handleMouseDown = () => {
      tooltipVisible.value = true
    }
    const handleMouseUp = () => {
      tooltipVisible.value = false
    }
    window.addEventListener('mousemove', updateTooltipPosition)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', updateTooltipPosition)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const selectClick = () => {
    if (selectionMode.value == SelectionMode.SINGLE) {
      selection.value = [volumeIndex]
    } else if (selectionMode.value == SelectionMode.MULTIPLE) {
      if (selected.value) {
        selection.value = selection.value.filter((i) => i != volumeIndex)
      } else {
        selection.value = [...selection.value, volumeIndex]
      }
    }
  }

  const nextVolume = () => {
    const currentVol = nv.volumes[0].frame4D
    nv.setFrame4D(nv.volumes[0].id, currentVol + 1)
    vol4D.value = nv.volumes[0].frame4D
  }

  const prevVolume = () => {
    const currentVol = nv.volumes[0].frame4D
    nv.setFrame4D(nv.volumes[0].id, currentVol - 1)
    vol4D.value = nv.volumes[0].frame4D
  }

  const is4D = computed(() => nv.volumes[0]?.nFrame4D && nv.volumes[0]?.nFrame4D > 1)

  return html`
    <div
      class="relative ${selectionMode.value && selected.value ? 'outline outline-blue-500' : ''}"
      onClick=${selectClick}
    >
      <${NiiVueCanvas} ...${props} />
      ${hideUI.value > 0 &&
      html`
        <div class="absolute pointer-events-none text-xl text-outline left-1 top-0">
          ${dispName}
        </div>
        <div class="pointer-events-none absolute bottom-1 left-1">
          <span class="text-outline" data-testid="intensity-${volumeIndex}"
            >${location_local}: ${intensity}</span
          >
        </div>
      `}
      ${hideUI.value > 2 &&
      html`
        <button
          class="absolute bg-transparent text-xl cursor-pointer opacity-80 border-none text-outline top-0 right-1"
          onClick=${props.remove}
        >
          X
        </button>
      `}
      ${hideUI.value > 2 &&
      is4D.value &&
      html`
        <div class="absolute bottom-0 right-0">
          <span
            class="bg-gray-300 bg-opacity-50 rounded-md text-xl cursor-pointer border-none text-outline items-center w-5 h-6 flex justify-center m-1"
            data-testid="volume-${volumeIndex}"
          >
            ${vol4D}
          </span>
          <button
            class="bg-gray-300 bg-opacity-50 rounded-md text-2xl cursor-pointer border-none text-outline items-center w-5 h-6 flex justify-center m-1"
            onClick=${nextVolume}
          >
            +
          </button>

          <button
            class="bg-gray-300 bg-opacity-50 rounded-md text-3xl cursor-pointer border-none text-outline items-center w-5 h-6 flex justify-center m-1"
            onClick=${prevVolume}
          >
            -
          </button>
        </div>
      `}
      ${tooltipVisible.value &&
      html`
        <div
          style=${`position: fixed; left: ${tooltipPos.value.x}px; top: ${tooltipPos.value.y}px; background: rgba(0, 0, 0, 0.7); color: white; padding: 4px 8px; border-radius: 4px; pointer-events: none;`}
        >
          ${intensity.value}
        </div>
      `}
    </div>
  `
}

function setIntensityAndLocation(
  data: any,
  intensity: Signal<string>,
  location_local: Signal<string>,
  location: Signal<string>,
  setGlobalLocation: Boolean,
) {
  const parts = data.string.split('=')
  if (parts.length === 2) {
    intensity.value = parts.pop()
  }
  location_local.value = arrayToString(data.vox, 0)
  if (setGlobalLocation) {
    location.value = `${arrayToString(data.mm)} mm`
  }
}

function arrayToString(array: number[], precision = 2) {
  let str = ''
  for (const val of array) {
    str += val.toFixed(precision) + ' x '
  }
  return str.slice(0, -3)
}
