import { html } from 'htm/preact'
import { useEffect, MutableRef } from 'preact/hooks'
import { differenceInNames } from '../utility'
import { Volume } from './Volume'
import { SLICE_TYPE } from '@niivue/niivue'
import { AppProps } from './App'
import { computed, effect, useSignal } from '@preact/signals'

type Size = {
  height: number
  width: number
}

export const Container = (props: AppProps) => {
  const { nvArray, headerRef, footerRef, nv0 } = props
  const render = useSignal(0)
  const windowInnerSize = useSignal({
    width: window.innerWidth,
    height: window.innerHeight,
  })
  useEffect(() => {
    window.onresize = () => {
      windowInnerSize.value = {
        width: window.innerWidth,
        height: window.innerHeight,
      }
    }
  }, [])

  const availableSize = computed(() => {
    render.value
    nv0.value
    return calculateDimensions(windowInnerSize.value, headerRef, footerRef)
  })
  const canvasSize = computed(() =>
    getCanvasSize(
      nvArray.value.length,
      nvArray.value?.[0]?.volumes?.[0]?.getImageMetadata() ?? {},
      props.sliceType.value,
      availableSize.value
    )
  )

  effect(() => syncVolumes(nvArray.value))

  const fullNames = computed(() => getNames(nvArray.value))
  const names = computed(() => differenceInNames(fullNames.value))

  return html`
    <div class="flex flex-wrap gap-x-1 w-full">
      ${nvArray.value.map(
        (nv, i) => html`<${Volume} nv=${nv} width=${canvasSize.value.width}
        height=${canvasSize.value.height} volumeIndex=${i}
        name=${names.value[i]} key=${nv.key} render=${render}
        remove=${remove(props, i)} "...${props}" />`,
      )}
    </div>
  `
}

function remove(props: AppProps, i: number) {
  const { nvArray, nv0, location } = props
  return () => {
    nvArray.value.splice(i, 1)
    nvArray.value = [...nvArray.value]
    if (nvArray.value.length == 0) {
      nv0.value = { isLoaded: false }
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

function getCanvasSize(
  nCanvas: number,
  meta: any,
  sliceType: number,
  windowSize: Size
) {
  const gap = 4
  const aspectRatio = getAspectRatio(meta, sliceType)
  if (nCanvas === 0) {
    nCanvas = 1
  }

  let bestWidth = 0
  for (let nrow = 1; nrow <= nCanvas; nrow++) {
    const ncol = Math.ceil(nCanvas / nrow)
    const maxHeight = Math.floor(windowSize.height / nrow - gap)
    const maxWidth = Math.floor(
      Math.min(windowSize.width / ncol - gap, maxHeight * aspectRatio)
    )
    if (maxWidth > bestWidth) {
      bestWidth = maxWidth
    }
  }
  return { width: bestWidth, height: bestWidth / aspectRatio }
}

function calculateDimensions(
  windowSize: Size,
  headerRef: MutableRef<HTMLDivElement | undefined>,
  footerRef: MutableRef<HTMLDivElement | undefined>
) {
  const headerHeight = headerRef.current ? headerRef.current.offsetHeight : 20
  const footerHeight = footerRef.current ? footerRef.current.offsetHeight : 20
  return {
    width: windowSize.width - 10,
    height: windowSize.height - headerHeight - footerHeight,
  }
}


function syncVolumes(nvArray: Niivue[]) {
  nvArray.forEach((nv) =>
    nv.broadcastTo(nvArray.filter((nvi) => nvi !== nv && nvi.isLoaded))
  )
}
