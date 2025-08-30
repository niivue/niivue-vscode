import { Niivue, SLICE_TYPE } from '@niivue/niivue'
import { computed, effect, useSignal } from '@preact/signals'
import { useEffect, useRef } from 'preact/hooks'
import { ExtendedNiivue } from '../events'
import { differenceInNames } from '../utility'
import { AppProps } from './AppProps'
import { Volume } from './Volume'

type Size = {
  height: number
  width: number
}

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
    window.onresize = setSize
  }, [])

  useEffect(() => {
    setSize()
  }, [nvArray.value.length, render.value])

  const canvasSize = computed(() =>
    getCanvasSize(
      nvArray.value.length,
      nvArray.value?.[0]?.volumes?.[0]?.getImageMetadata() ?? {},
      props.sliceType.value,
      windowInnerSize.value,
    ),
  )

  effect(() => syncVolumes(nvArray.value))

  const fullNames = computed(() => getNames(nvArray.value))
  const names = computed(() => differenceInNames(fullNames.value))

  return (
    <div className="flex-grow h-full overflow-hidden" ref={sizeRef}>
      <div className="flex flex-wrap w-full gap-1 m-1">
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

function getNames(nvArray: Niivue[]) {
  return nvArray.map((item) => {
    if (item.volumes.length > 0) {
      return decodeURIComponent(item.volumes[0].name)
    }
    if (item.meshes.length > 0) {
      return decodeURIComponent(item.meshes[0].name)
    }
    return ''
  })
}

function getAspectRatio(meta: any, sliceType: number) {
  if (!meta.nx) {
    return 1
  }
  const xSize = meta.nx * meta.dx
  const ySize = meta.ny * meta.dy
  const zSize = meta.nz * meta.dz
  if (sliceType === SLICE_TYPE.AXIAL) {
    return xSize / ySize
  } else if (sliceType === SLICE_TYPE.CORONAL) {
    return xSize / zSize
  } else if (sliceType === SLICE_TYPE.SAGITTAL) {
    return ySize / zSize
  } else if (sliceType === SLICE_TYPE.MULTIPLANAR) {
    return (xSize + ySize) / (zSize + ySize)
  }
  return 1
}

function getCanvasSize(nCanvas: number, meta: any, sliceType: number, windowSize: Size) {
  const gap = 4
  const aspectRatio = getAspectRatio(meta, sliceType)
  if (nCanvas === 0) {
    nCanvas = 1
  }

  let bestWidth = 0
  for (let nrow = 1; nrow <= nCanvas; nrow++) {
    const ncol = Math.ceil(nCanvas / nrow)
    const maxHeight = Math.floor(windowSize.height / nrow - gap)
    const maxWidth = Math.floor(Math.min(windowSize.width / ncol - gap, maxHeight * aspectRatio))
    if (maxWidth > bestWidth) {
      bestWidth = maxWidth
    }
  }
  return { width: bestWidth, height: bestWidth / aspectRatio }
}

function syncVolumes(nvArray: ExtendedNiivue[]) {
  nvArray.forEach((nv) => nv.broadcastTo(nvArray.filter((nvi) => nvi !== nv && nvi.isLoaded)))
}
