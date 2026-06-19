import '../styles/tokens.css'
import './Volume.css'
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
  swap: (i: number, j: number) => void
  insertAt: (fromIndex: number, insertPosition: number) => void
  draggingIndex: Signal<number | null>
  dropInsertPos: Signal<number | null>
  dropSwapIndex: Signal<number | null>
  width: number
  height: number
  render: Signal<number>
}

export const Volume = (props: AppProps & VolumeProps) => {
  const {
    name,
    volumeIndex,
    hideUI,
    selection,
    selectionMode,
    nv,
    location,
    swap,
    insertAt,
    draggingIndex,
    dropInsertPos,
    dropSwapIndex,
  } = props
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

  useEffect(() => {
    // v1: location updates arrive as the 'locationChange' DOM event (the settable
    // nv.onLocationChange callback was removed). Register once and read
    // selection.value live inside the handler so it reacts to selection changes
    // without re-adding listeners; clean up on unmount.
    const onLoc = (e: CustomEvent) =>
      setIntensityAndLocation(
        e.detail,
        intensity,
        location_local,
        location,
        volumeIndex == selection.value[0],
        vol4D,
        nv,
      )
    nv.addEventListener('locationChange', onLoc)
    nv.onFrameUpdate = (frame: number) => {
      vol4D.value = frame
    }
    return () => nv.removeEventListener('locationChange', onLoc)
  }, [])

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

  // Custom MIME type identifies our own reorder drags so the file-import path
  // (which carries 'Files') and other drags from outside the app are ignored.
  const REORDER_MIME = 'application/x-niivue-reorder'

  const resetDragSignals = () => {
    draggingIndex.value = null
    dropInsertPos.value = null
    dropSwapIndex.value = null
  }

  const handleDragStart = (e: DragEvent) => {
    e.dataTransfer!.effectAllowed = 'move'
    e.dataTransfer!.setData(REORDER_MIME, volumeIndex.toString())
    draggingIndex.value = volumeIndex
  }

  const handleDragEnd = () => {
    resetDragSignals()
  }

  const isReorderDrag = (e: DragEvent) =>
    e.dataTransfer?.types.includes(REORDER_MIME) ?? false

  // Helpers for the three drop zones. Each zone sets a highlight signal on
  // dragover and performs the matching operation on drop. dragleave clears
  // only this zone's signal so a fast move into another zone doesn't flicker.
  const onZoneOver = (mode: 'insert-before' | 'swap' | 'insert-after') => (e: DragEvent) => {
    if (!isReorderDrag(e)) return
    e.preventDefault()
    e.dataTransfer!.dropEffect = 'move'
    if (mode === 'swap') {
      dropSwapIndex.value = volumeIndex
      dropInsertPos.value = null
    } else {
      dropInsertPos.value = mode === 'insert-before' ? volumeIndex : volumeIndex + 1
      dropSwapIndex.value = null
    }
  }

  const onZoneLeave = (mode: 'insert-before' | 'swap' | 'insert-after') => () => {
    if (mode === 'swap') {
      if (dropSwapIndex.value === volumeIndex) dropSwapIndex.value = null
    } else {
      const pos = mode === 'insert-before' ? volumeIndex : volumeIndex + 1
      if (dropInsertPos.value === pos) dropInsertPos.value = null
    }
  }

  const onZoneDrop = (mode: 'insert-before' | 'swap' | 'insert-after') => (e: DragEvent) => {
    if (!isReorderDrag(e)) return
    e.preventDefault()
    const fromIndex = parseInt(e.dataTransfer!.getData(REORDER_MIME))
    if (!Number.isInteger(fromIndex)) {
      resetDragSignals()
      return
    }
    if (mode === 'swap') {
      if (fromIndex !== volumeIndex) swap(fromIndex, volumeIndex)
    } else {
      const insertPosition = mode === 'insert-before' ? volumeIndex : volumeIndex + 1
      insertAt(fromIndex, insertPosition)
    }
    resetDragSignals()
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

  // Use capture-phase listeners to intercept drag/drop before niivue's canvas handlers
  // (niivue registers bubble-phase listeners that call stopPropagation, preventing our handlers)
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return

    // Only intercept FILE drags here. For reorder drags (custom MIME) we must
    // not stopPropagation, because that would also kill the bubble-phase
    // handlers on the drop-zone overlays below: the target of a reorder drag
    // is a descendant of this element, so capture-phase stopPropagation
    // prevents the bubble from ever reaching them.
    const handleCanvasDragOver = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return
      e.stopPropagation()
      e.preventDefault()
      e.dataTransfer.dropEffect = 'link'
    }

    const handleCanvasDrop = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return
      e.stopPropagation()
      e.preventDefault()
      const files = Array.from(e.dataTransfer.files ?? [])
      if (files.length === 0) return

      if (e.shiftKey) {
        // shift+drop adds files as overlays to this canvas
        const readOverlays = async () => {
          for (const file of files) {
            const buffer = await file.arrayBuffer()
            window.postMessage({
              type: 'overlay',
              body: {
                data: buffer,
                uri: file.name,
                index: volumeIndex,
              },
            })
          }
        }
        readOverlays()
      } else {
        // normal drop creates new canvases
        window.postMessage({
          type: 'initCanvas',
          body: { n: files.length },
        })
        const readImages = async () => {
          for (const file of files) {
            const buffer = await file.arrayBuffer()
            window.postMessage({
              type: 'addImage',
              body: {
                data: buffer,
                uri: file.name,
              },
            })
          }
        }
        readImages()
      }
    }

    el.addEventListener('dragover', handleCanvasDragOver, { capture: true })
    el.addEventListener('drop', handleCanvasDrop, { capture: true })

    return () => {
      el.removeEventListener('dragover', handleCanvasDragOver, { capture: true })
      el.removeEventListener('drop', handleCanvasDrop, { capture: true })
    }
  }, [canvasRef.current, volumeIndex])

  const isSource = draggingIndex.value === volumeIndex
  const isDragInProgress = draggingIndex.value !== null
  const isSwapTarget = dropSwapIndex.value === volumeIndex
  const showLeftBar = dropInsertPos.value === volumeIndex
  const showRightBar = dropInsertPos.value === volumeIndex + 1

  // When the source is adjacent, the gap between us and the source is a no-op
  // insert (insert-before-self or insert-after-self). Hide that side's insert
  // zone and let the swap zone absorb its width so the user can still target
  // this volume from the full 2/3.
  const sourceIsRightNeighbor = draggingIndex.value === volumeIndex + 1
  const sourceIsLeftNeighbor = draggingIndex.value === volumeIndex - 1
  const hideLeftZone = sourceIsLeftNeighbor
  const hideRightZone = sourceIsRightNeighbor

  return (
    <div
      className={`nv-pane${selectionMode.value && selected.value ? ' is-selected' : ''}${
        isSwapTarget ? ' outline outline-green-500 outline-2' : ''
      }${isSource ? ' opacity-50' : ''}`}
      onClick={selectClick}
      ref={canvasRef}
      draggable={hideUI.value > 2}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
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
          {nv.loadError.includes('unable to get WebGL context') && (
            <div className="text-xs text-gray-300 text-center max-w-full mt-3">
              Your GPU or driver could not provide a WebGL2 context. This is an environment issue,
              not a problem with the file.{' '}
              <a
                href="https://github.com/niivue/niivue-vscode/issues/236"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline"
              >
                How to fix
              </a>
            </div>
          )}
        </div>
      ) : (
        <NiiVueCanvas {...props} render={props.render} />
      )}
      {hideUI.value > 0 && !nv.loadError && (
        <>
          <div className="nv-pane-label">
            <span className="nv-pane-label-text">{dispName}</span>
          </div>
          <div className="nv-readout">
            <span className="nv-readout-k">POS</span>
            <span className="nv-readout-v">{location_local.value}</span>
            <span className="nv-readout-k">VAL</span>
            <span className="nv-readout-v" data-testid={`intensity-${volumeIndex}`}>
              {intensity.value}
            </span>
          </div>
        </>
      )}
      {hideUI.value > 2 && (
        <>
          {/* Drag handle: thin strip so canvas clicks reach niivue everywhere else. */}
          <div
            className="absolute top-0 left-0 right-0 h-4 cursor-move bg-gradient-to-b from-black/30 to-transparent"
            title="Drag to reorder"
          />
          <button
            className="nv-iconbtn nv-iconbtn-ghost absolute top-1.5 right-1.5 z-10"
            onClick={props.remove}
            aria-label="Close"
          >
            ×
          </button>
        </>
      )}
      {/* Drop-zone overlays. Only rendered while a reorder drag is in flight
          and never on the source itself. Three columns: left third "insert
          before this volume", middle third "swap with this volume", right
          third "insert after this volume". When the source is the adjacent
          volume, that side's insert is a no-op so we skip rendering it and
          let the swap zone expand to fill the freed third. */}
      {isDragInProgress && !isSource && hideUI.value > 2 && (
        <>
          {!hideLeftZone && (
            <div
              className="absolute top-0 bottom-0 left-0 w-1/3"
              onDragOver={onZoneOver('insert-before')}
              onDragLeave={onZoneLeave('insert-before')}
              onDrop={onZoneDrop('insert-before')}
              data-testid={`drop-insert-before-${volumeIndex}`}
            />
          )}
          <div
            className={`absolute top-0 bottom-0 ${hideLeftZone ? 'left-0' : 'left-1/3'} ${
              hideRightZone ? 'right-0' : 'right-1/3'
            }`}
            onDragOver={onZoneOver('swap')}
            onDragLeave={onZoneLeave('swap')}
            onDrop={onZoneDrop('swap')}
            data-testid={`drop-swap-${volumeIndex}`}
          />
          {!hideRightZone && (
            <div
              className="absolute top-0 bottom-0 right-0 w-1/3"
              onDragOver={onZoneOver('insert-after')}
              onDragLeave={onZoneLeave('insert-after')}
              onDrop={onZoneDrop('insert-after')}
              data-testid={`drop-insert-after-${volumeIndex}`}
            />
          )}
        </>
      )}
      {/* Insert-position bars sit on the edges and fill into the inter-volume
          gap. When inserting between K and K+1, K's right bar and K+1's left
          bar appear at the same time, visually merging across the gap. */}
      {showLeftBar && (
        <div
          className="absolute -left-0.5 top-0 bottom-0 w-1 bg-green-500 pointer-events-none z-10"
          data-testid={`drop-bar-left-${volumeIndex}`}
        />
      )}
      {showRightBar && (
        <div
          className="absolute -right-0.5 top-0 bottom-0 w-1 bg-green-500 pointer-events-none z-10"
          data-testid={`drop-bar-right-${volumeIndex}`}
        />
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
    vol4D.value = nv.volumes[0].frame4D ?? 0
  }
}

function arrayToStringFixed(array: number[], precision = 2) {
  let str = ''
  for (const val of array) {
    str += val.toFixed(precision) + ' x '
  }
  return str.slice(0, -3)
}

function arrayToStringFlexible(array: number[]) {
  let str = ''
  for (const val of array) {
    str += formatVoxelValue(val) + ', '
  }
  return str.slice(0, -2)
}

// Integers print verbatim (e.g. "1044"). Floats keep a fixed width by showing 5
// significant figures *without* trimming trailing zeros, so the readout doesn't
// jitter between e.g. "15.533" and "15.54" as the crosshair moves — it stays
// "15.540". Non-finite values (NaN/Infinity) print as-is.
function formatVoxelValue(val: number): string {
  if (!Number.isFinite(val)) return String(val)
  if (Number.isInteger(val)) return String(val)
  return val.toPrecision(5)
}
