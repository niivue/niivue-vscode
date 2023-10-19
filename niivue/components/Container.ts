import { html } from 'htm/preact'
import { useState, useEffect, MutableRef } from 'preact/hooks'
import { differenceInNames } from '../utility'
import { Volume } from './Volume'
import { SLICE_TYPE } from '@niivue/niivue'
import { AppProps } from './App'
import { Signal } from '@preact/signals'

export const Container = (props: AppProps) => {
  const { nvArray, headerRef, footerRef } = props
  const [[windowWidth, windowHeight], setDimensions] = useState([
    window.innerWidth - 30,
    window.innerHeight - 80,
  ])

  const dimUpdate = () => updateDimensions(setDimensions, headerRef, footerRef)
  useEffect(() => (window.onresize = dimUpdate), [])
  syncVolumes(nvArray.value)

  const meta = nvArray.value?.[0]?.volumes?.[0]?.getImageMetadata() ?? {}
  const [width, height] = getCanvasSize(
    nvArray.value.length,
    meta,
    props.sliceType.value,
    windowWidth,
    windowHeight
  )
  const names = differenceInNames(getNames(nvArray.value))

  return html`
    <div class="container">
      ${nvArray.value.map(
        (nv, i) => html`<${Volume} nv=${nv} width=${width} height=${height}
        volumeIndex=${i} name=${names[i]} triggerRender=${dimUpdate}
        remove=${remove(props, i)} "...${props}" />`
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
  windowWidthExt: number,
  windowHeightExt: number
) {
  const gap = 4
  const aspectRatio = getAspectRatio(meta, sliceType)
  if (nCanvas === 0) {
    nCanvas = 1
  }
  const windowWidth = windowWidthExt
  const windowHeight = windowHeightExt

  let bestWidth = 0
  for (let nrow = 1; nrow <= nCanvas; nrow++) {
    const ncol = Math.ceil(nCanvas / nrow)
    const maxHeight = Math.floor(windowHeight / nrow - gap)
    const maxWidth = Math.floor(
      Math.min(windowWidth / ncol - gap, maxHeight * aspectRatio)
    )
    if (maxWidth > bestWidth) {
      bestWidth = maxWidth
    }
  }
  return [bestWidth, bestWidth / aspectRatio]
}

function updateDimensions(
  setDimensions: Function,
  headerRef: MutableRef<HTMLDivElement | undefined>,
  footerRef: MutableRef<HTMLDivElement | undefined>
) {
  const headerHeight = headerRef.current ? headerRef.current.offsetHeight : 20
  const footerHeight = footerRef.current ? footerRef.current.offsetHeight : 20
  setDimensions([
    window.innerWidth - 10,
    window.innerHeight - headerHeight - footerHeight,
  ])
}

function syncVolumes(nvArray: Niivue[]) {
  nvArray.forEach((nv) =>
    nv.broadcastTo(nvArray.filter((nvi) => nvi !== nv && nvi.isLoaded))
  )
}
