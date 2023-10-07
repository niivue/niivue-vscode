import { html } from 'htm/preact'
import { useState, useEffect } from 'preact/hooks'
import { differenceInNames } from '../utility'
import { Volume } from './Volume'
import { SLICE_TYPE } from '@niivue/niivue'

export const Container = ({ nvArray, headerRef, footerRef, ...props }) => {
  const [[windowWidth, windowHeight], setDimensions] = useState([
    window.innerWidth - 30,
    window.innerHeight - 80,
  ])

  const dimUpdate = () => updateDimensions(setDimensions, headerRef, footerRef)
  useEffect(() => (window.onresize = dimUpdate))
  syncVolumes(nvArray)

  const meta = nvArray?.[0]?.volumes?.[0]?.getImageMetadata() ?? {}
  const [width, height] = getCanvasSize(
    nvArray.length,
    meta,
    props.sliceType,
    windowWidth,
    windowHeight,
  )
  const names = differenceInNames(getNames(nvArray))
  return html`
    <div class="container">
      ${nvArray.map(
        (nv, i) =>
          html`<${Volume}
            nv=${nv}
            width=${width}
            height=${height}
            volumeIndex=${i}
            name=${names[i]}
            triggerRender=${dimUpdate}
            ...${props}
          />`,
      )}
    </div>
  `
}

function getNames(nvArray) {
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

function getAspectRatio(meta, sliceType) {
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
  nCanvas,
  meta,
  sliceType,
  windowWidthExt,
  windowHeightExt,
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
      Math.min(windowWidth / ncol - gap, maxHeight * aspectRatio),
    )
    if (maxWidth > bestWidth) {
      bestWidth = maxWidth
    }
  }
  return [bestWidth, bestWidth / aspectRatio]
}

function updateDimensions(setDimensions: Function, headerRef, footerRef) {
  const headerHeight = headerRef.current ? headerRef.current.offsetHeight : 20
  const footerHeight = footerRef.current ? footerRef.current.offsetHeight : 20
  setDimensions([
    window.innerWidth - 10,
    window.innerHeight - headerHeight - footerHeight,
  ])
}

function syncVolumes(nvArray) {
  nvArray.forEach((nv) =>
    nv.broadcastTo(nvArray.filter((nvi) => nvi !== nv && nvi.isLoaded)),
  )
}
  