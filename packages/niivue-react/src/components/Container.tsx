import { computed, effect, useSignal } from '@preact/signals'
import { useEffect, useRef } from 'preact/hooks'
import { ExtendedNiivue } from '../events'
import { getCanvasSize } from '../layout'
import { DEFAULT_TILE_SPACING } from '../settings'
import { differenceInNames, getImageMetadata, getNames, reorderImages, swapImages } from '../utility'
import { AppProps } from './AppProps'
import { Volume } from './Volume'

export const Container = (props: AppProps) => {
  const { nvArray } = props
  const sizeRef = useRef<HTMLDivElement | null>(null)
  const render = useSignal(0)
  const windowInnerSize = useSignal({
    width: 100,
    height: 100,
  })

  const setSize = () => {
    windowInnerSize.value = {
      width: sizeRef.current?.offsetWidth ?? 100,
      height: sizeRef.current?.offsetHeight ?? 100,
    }
  }

  useEffect(() => {
    const el = sizeRef.current
    if (!el) return
    setSize()
    // Observe the container's own box rather than only window resizes: the menu
    // bar can reflow or collapse (overflow into "More", the status strip toggling
    // with hideUI) with no window-resize event. A stale measurement then sizes
    // the canvases too large and produces scrollbars on both axes.
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => setSize())
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    setSize()
  }, [nvArray.value.length, render.value])

  const canvasSize = computed(() =>
    getCanvasSize(
      nvArray.value.length,
      getImageMetadata(nvArray.value?.[0]?.volumes?.[0]),
      props.sliceType.value,
      windowInnerSize.value,
      props.settings.value.tileSpacing ?? DEFAULT_TILE_SPACING,
    ),
  )

  effect(() => syncVolumes(nvArray.value))

  const fullNames = computed(() => getNames(nvArray.value))
  const names = computed(() => differenceInNames(fullNames.value))

  // Shared drag-reorder state. Null when no reorder drag is in flight.
  const draggingIndex = useSignal<number | null>(null)
  // The slot the user would insert into if they dropped now. Range is
  // 0..nvArray.length (inclusive on both ends).
  const dropInsertPos = useSignal<number | null>(null)
  // The index they would swap with if they dropped now.
  const dropSwapIndex = useSignal<number | null>(null)

  const swap = (i: number, j: number) => {
    nvArray.value = swapImages(nvArray.value, i, j)
  }

  // Insert fromIndex at insertPosition in the *original* index frame. After
  // removing the source, indices >= fromIndex shift down by one, so we
  // compensate when fromIndex < insertPosition.
  const insertAt = (fromIndex: number, insertPosition: number) => {
    if (fromIndex === insertPosition || fromIndex + 1 === insertPosition) return
    const targetIndex = fromIndex < insertPosition ? insertPosition - 1 : insertPosition
    nvArray.value = reorderImages(nvArray.value, fromIndex, targetIndex)
  }

  const spacing = props.settings.value.tileSpacing ?? DEFAULT_TILE_SPACING

  return (
    <div className="flex-1 min-h-0 min-w-0 overflow-hidden" ref={sizeRef}>
      <div className="flex flex-wrap w-full m-1" style={{ gap: `${spacing}px` }}>
        {nvArray.value.map((nv, i) => (
          <Volume
            nv={nv}
            width={canvasSize.value.width}
            height={canvasSize.value.height}
            volumeIndex={i}
            name={names.value[i]}
            key={nv.key}
            render={render}
            remove={remove(props, i)}
            draggingIndex={draggingIndex}
            dropInsertPos={dropInsertPos}
            dropSwapIndex={dropSwapIndex}
            swap={swap}
            insertAt={insertAt}
            {...props}
          />
        ))}
      </div>
    </div>
  )
}

function remove(props: AppProps, i: number) {
  const { nvArray, location } = props
  return () => {
    nvArray.value.splice(i, 1)
    nvArray.value = [...nvArray.value]
    if (nvArray.value.length == 0) {
      location.value = ''
    }
  }
}

function syncVolumes(nvArray: ExtendedNiivue[]) {
  nvArray.forEach((nv) => nv.broadcastTo(nvArray.filter((nvi) => nvi !== nv && nvi.isLoaded)))
}
