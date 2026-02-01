import { computed, Signal, useSignal } from '@preact/signals'
import { useEffect, useRef } from 'preact/hooks'
import { ExtendedNiivue } from '../events'
import { AppProps, SelectionMode } from './AppProps'
import { Nav4D } from './Nav4D'
import { NiiVueCanvas } from './NiiVueCanvas'

export interface VolumeProps {
  name: string
  volumeIndex: number
  nv: ExtendedNiivue
  remove: () => void
  reorder: (fromIndex: number, toIndex: number) => void
  width: number
  height: number
  render: Signal<number>
}

export const Volume = (props: AppProps & VolumeProps) => {
  const { name, volumeIndex, hideUI, selection, selectionMode, nv, location, reorder } = props
  const intensity = useSignal('')
  const location_local = useSignal('')
  const vol4D = useSignal(0)
  const isEditingVol4D = useSignal(false)
  const isPlaying = useSignal(false)
  const dispName = name.length > 20 ? `...${name.slice(-20)}` : name
  const selected = computed(() => selection.value.includes(volumeIndex))
  const tooltipVisible = useSignal(false)
  const tooltipPos = useSignal({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const isDragging = useSignal(false)
  const dragOver = useSignal(false)

  useEffect(() => {
    nv.onLocationChange = (data: any) =>
      setIntensityAndLocation(
        data,
        intensity,
        location_local,
        location,
        volumeIndex == selection.value[0],
        vol4D,
        nv,
      )
    nv.onFrameUpdate = (frame: number) => {
      vol4D.value = frame
    }
  }, [selection.value])

  // Stop playback when volume is deselected or editing begins
  useEffect(() => {
    if ((!selected.value || isEditingVol4D.value) && isPlaying.value) {
      isPlaying.value = false
    }
  }, [selected.value, isEditingVol4D.value, isPlaying])

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

  const handleDragStart = (e: DragEvent) => {
    isDragging.value = true
    e.dataTransfer!.effectAllowed = 'move'
    e.dataTransfer!.setData('text/plain', volumeIndex.toString())
  }

  const handleDragEnd = () => {
    isDragging.value = false
    dragOver.value = false
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer!.dropEffect = 'move'
    dragOver.value = true
  }

  const handleDragLeave = () => {
    dragOver.value = false
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    dragOver.value = false

    const fromIndex = parseInt(e.dataTransfer!.getData('text/plain'))
    const toIndex = volumeIndex

    if (fromIndex !== toIndex) {
      reorder(fromIndex, toIndex)
    }
  }

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

  const is4D = computed(() => nv.volumes[0]?.nFrame4D && nv.volumes[0]?.nFrame4D > 1)

  return (
    <div
      className={`relative ${
        selectionMode.value && selected.value ? 'outline outline-blue-500' : ''
      } ${dragOver.value ? 'outline outline-green-500 outline-2' : ''}`}
      onClick={selectClick}
      ref={canvasRef}
      draggable={hideUI.value > 2}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {nv.loadError ? (
        <div
          className="flex flex-col items-center justify-center bg-gray-900 text-white p-4 overflow-hidden"
          style={{ width: `${props.width}px`, height: `${props.height}px` }}
        >
          <div className="text-red-500 text-3xl mb-2">⚠</div>
          <div className="text-lg font-bold mb-1">Failed to load image</div>
          <div className="text-sm text-gray-300 break-all text-center max-w-full italic mb-4">
            {name}
          </div>
          <div className="text-xs text-gray-400 bg-black/30 p-2 rounded max-w-full overflow-y-auto max-h-24">
            {nv.loadError}
          </div>
        </div>
      ) : (
        <NiiVueCanvas {...props} render={props.render} />
      )}
      {hideUI.value > 0 && !nv.loadError && (
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
        <>
          <div
            className="absolute top-0 left-0 right-0 h-8 cursor-move bg-gradient-to-b from-black/30 to-transparent pointer-events-auto"
            title="Drag to reorder"
          />
          <button
            className="absolute bg-transparent text-xl cursor-pointer opacity-80 border-none text-outline top-0 right-1 pointer-events-auto"
            onClick={props.remove}
          >
            X
          </button>
        </>
      )}
      {hideUI.value > 2 && is4D.value && (
        <Nav4D
          nv={nv}
          nvArray={props.nvArray}
          volumeIndex={volumeIndex}
          vol4D={vol4D}
          isPlaying={isPlaying}
          isEditingVol4D={isEditingVol4D}
          syncedIndices={props.syncedIndices}
        />
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
  vol4D: Signal<number>,
  nv: ExtendedNiivue,
) {
  intensity.value = arrayToStringFlexible(data.values.map((item: { value: number }) => item.value))
  location_local.value = arrayToStringFixed(data.vox, 0)
  if (setGlobalLocation) {
    location.value = `${arrayToStringFixed(data.mm)} mm`
  }
  if (nv.volumes.length > 0 && nv.volumes[0]?.nFrame4D && nv.volumes[0].nFrame4D > 1) {
    vol4D.value = nv.volumes[0].frame4D
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
