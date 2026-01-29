import { computed, Signal, useSignal } from '@preact/signals'
import { useEffect, useRef } from 'preact/hooks'
import { ExtendedNiivue } from '../events'
import { AppProps, SelectionMode } from './AppProps'
import { NiiVueCanvas } from './NiiVueCanvas'

export interface VolumeProps {
  name: string
  volumeIndex: number
  nv: ExtendedNiivue
  remove: () => void
  width: number
  height: number
  render: Signal<number>
}

export const Volume = (props: AppProps & VolumeProps) => {
  const { name, volumeIndex, hideUI, selection, selectionMode, nv, location } = props
  const intensity = useSignal('')
  const location_local = useSignal('')
  const vol4D = useSignal(0)
  const vol4DInput = useSignal('')
  const isEditingVol4D = useSignal(false)
  const isPlaying = useSignal(false)
  const dispName = name.length > 20 ? `...${name.slice(-20)}` : name
  const selected = computed(() => selection.value.includes(volumeIndex))
  const is4D = computed(() => nv.volumes[0]?.nFrame4D && nv.volumes[0]?.nFrame4D > 1)
  const tooltipVisible = useSignal(false)
  const tooltipPos = useSignal({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const playIntervalRef = useRef<number | null>(null)

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

  // Keyboard listener for arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle arrow keys when not editing and this volume is selected
      if (!isEditingVol4D.value && is4D.value && selected.value) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
          e.preventDefault()
          nextVolume()
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
          e.preventDefault()
          prevVolume()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isEditingVol4D.value, is4D.value, selected.value])

  // Cleanup play interval on unmount
  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
    }
  }, [])

  // Mouse listeners for updating tooltip position and visibility
  useEffect(() => {
    const updateTooltipPosition = (e: MouseEvent) => {
      tooltipPos.value = { x: e.clientX + 10, y: e.clientY + 10 }
    }
    const handleMouseDown = (e: MouseEvent) => {
      if (canvasRef.current && canvasRef.current.contains(e.target as Node)) {
        tooltipVisible.value = true
      }
    }
    const handleMouseUp = () => {
      tooltipVisible.value = false
    }
    const handleMouseLeave = () => {
      tooltipVisible.value = false
    }
    window.addEventListener('mousemove', updateTooltipPosition)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    canvasRef.current?.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      window.removeEventListener('mousemove', updateTooltipPosition)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      canvasRef.current?.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [canvasRef.current])

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

  const setVol4D = (value: number) => {
    const nFrame4D = nv.volumes[0]?.nFrame4D
    if (!nFrame4D) return
    const maxFrame = nFrame4D - 1
    const clampedValue = Math.max(0, Math.min(maxFrame, value))
    nv.setFrame4D(nv.volumes[0].id, clampedValue)
    vol4D.value = nv.volumes[0].frame4D
  }

  const handleVol4DClick = (e: MouseEvent) => {
    e.stopPropagation()
    isEditingVol4D.value = true
    vol4DInput.value = vol4D.value.toString()
  }

  const handleVol4DChange = (e: Event) => {
    const target = e.target as HTMLInputElement
    vol4DInput.value = target.value
  }

  const handleVol4DKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      const value = parseInt(vol4DInput.value, 10)
      if (!isNaN(value)) {
        setVol4D(value)
      }
      isEditingVol4D.value = false
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      vol4DInput.value = vol4D.value.toString() // Reset to current value
      isEditingVol4D.value = false
    }
  }

  const handleVol4DBlur = () => {
    const value = parseInt(vol4DInput.value, 10)
    if (!isNaN(value)) {
      setVol4D(value)
    }
    isEditingVol4D.value = false
  }

  const togglePlay = () => {
    if (isPlaying.value) {
      // Stop playing
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
        playIntervalRef.current = null
      }
      isPlaying.value = false
    } else {
      // Start playing
      isPlaying.value = true
      playIntervalRef.current = window.setInterval(() => {
        const nFrame4D = nv.volumes[0]?.nFrame4D
        if (!nFrame4D) return
        const currentFrame = nv.volumes[0].frame4D
        const nextFrame = (currentFrame + 1) % nFrame4D
        nv.setFrame4D(nv.volumes[0].id, nextFrame)
        vol4D.value = nv.volumes[0].frame4D
      }, 200) // 200ms delay between frames (5 fps)
    }
  }

  return (
    <div
      className={`relative ${
        selectionMode.value && selected.value ? 'outline outline-blue-500' : ''
      }`}
      onClick={selectClick}
      ref={canvasRef}
    >
      <NiiVueCanvas {...props} render={props.render} />
      {hideUI.value > 0 && (
        <>
          <div className="absolute pointer-events-none text-xl text-outline left-1 top-0">
            {dispName}
          </div>
          <div className="pointer-events-none absolute bottom-1 left-1">
            <span className="text-outline" data-testid={`intensity-${volumeIndex}`}>
              {location_local.value}: {intensity.value}
            </span>
          </div>
        </>
      )}
      {hideUI.value > 2 && (
        <button
          className="absolute bg-transparent text-xl cursor-pointer opacity-80 border-none text-outline top-0 right-1"
          onClick={props.remove}
        >
          X
        </button>
      )}
      {hideUI.value > 2 && is4D.value && (
        <div className="absolute bottom-0 right-0">
          {isEditingVol4D.value ? (
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={vol4DInput.value}
              onInput={handleVol4DChange}
              onKeyDown={handleVol4DKeyDown}
              onBlur={handleVol4DBlur}
              className="bg-gray-300 bg-opacity-50 rounded-md text-xl text-center border-none text-outline w-12 h-6 m-1"
              data-testid={`volume-input-${volumeIndex}`}
              aria-label="4D volume frame number"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className="bg-gray-300 bg-opacity-50 rounded-md text-xl cursor-text border-none text-outline items-center w-12 h-6 flex justify-center m-1"
              data-testid={`volume-${volumeIndex}`}
              onClick={handleVol4DClick}
            >
              {vol4D.value}
            </span>
          )}
          <button
            className="bg-gray-300 bg-opacity-50 rounded-md text-2xl cursor-pointer border-none text-outline items-center w-5 h-6 flex justify-center m-1"
            onClick={nextVolume}
            aria-label="Next frame"
          >
            +
          </button>
          <button
            className="bg-gray-300 bg-opacity-50 rounded-md text-3xl cursor-pointer border-none text-outline items-center w-5 h-6 flex justify-center m-1"
            onClick={prevVolume}
            aria-label="Previous frame"
          >
            -
          </button>
          <button
            className="bg-gray-300 bg-opacity-50 rounded-md text-xl cursor-pointer border-none text-outline items-center w-5 h-6 flex justify-center m-1"
            onClick={togglePlay}
            aria-label={isPlaying.value ? 'Pause' : 'Play'}
            data-testid={`volume-play-${volumeIndex}`}
          >
            {isPlaying.value ? '⏸' : '▶'}
          </button>
        </div>
      )}
      {tooltipVisible.value && (
        <div
          style={{
            position: 'fixed',
            left: `${tooltipPos.value.x}px`,
            top: `${tooltipPos.value.y}px`,
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            pointerEvents: 'none',
          }}
        >
          {intensity.value}
        </div>
      )}
    </div>
  )
}

function setIntensityAndLocation(
  data: any,
  intensity: Signal<string>,
  location_local: Signal<string>,
  location: Signal<string>,
  setGlobalLocation: Boolean,
) {
  intensity.value = arrayToStringFlexible(data.values.map((item: { value: number }) => item.value))
  location_local.value = arrayToStringFixed(data.vox, 0)
  if (setGlobalLocation) {
    location.value = `${arrayToStringFixed(data.mm)} mm`
  }
}

function arrayToStringFixed(array: number[], precision = 2) {
  let str = ''
  for (const val of array) {
    str += val.toFixed(precision) + ' x '
  }
  return str.slice(0, -3)
}

// If < 0.01 or larger than 10000, use scientific notation
function arrayToStringFlexible(array: number[]) {
  let str = ''
  for (const val of array) {
    const num = val.toPrecision(5).replace(/\.?0+$/, '') // Remove trailing zeros
    str += num + ', '
  }
  return str.slice(0, -2)
}
