/// <reference types="../types/virtual-modules" />
// Patch Dcm2niix for worker inlining before importing dicom-loader
import { Dcm2niix } from '@niivue/dcm2niix'
import workerUrl from 'dcm2niix-worker'

const originalInit = Dcm2niix.prototype.init

Dcm2niix.prototype.init = function () {
  this.worker = new Worker(workerUrl, { type: 'module' })

  return new Promise((resolve, reject) => {
    if (this.worker) {
      this.worker.onmessage = (event: MessageEvent) => {
        if (event.data?.type === 'ready') {
          resolve(true)
        }
      }

      this.worker.onerror = (error: ErrorEvent) => {
        reject(new Error(`Worker failed to load: ${error.message || 'Unknown error'}`))
      }
    }
  })
}

import { dicomLoader } from '@niivue/dicom-loader'
import { mnc2nii } from '@niivue/minc-loader'
import { NVImage, NVMesh } from '@niivue/niivue'
import { Signal } from '@preact/signals'
import { useEffect, useRef } from 'preact/hooks'
import { ExtendedNiivue, notifyImageLoaded } from '../events'
import { NiiVueSettings } from '../settings'
import { isDicomData, isImageType } from '../utility'
import { AppProps } from './AppProps'

export interface NiiVueCanvasProps {
  nv: ExtendedNiivue
  width: number
  height: number
  render: Signal<number>
}

export const NiiVueCanvas = ({
  nv,
  width,
  height,
  sliceType,
  render,
  nvArray,
  settings,
}: AppProps & NiiVueCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    canvasRef.current && !nv.canvas && nv.attachToCanvas(canvasRef.current)
  }, [canvasRef.current])

  useEffect(() => {
    if (!nv.body || nv.isLoading) {
      return
    }
    nv.isLoading = true
    loadVolume(nv, nv.body, settings.value)
      .then(async () => {
        nv.isLoaded = true
        nv.isLoading = false
        nv.body = null
        render.value++ // required to update the names
        nvArray.value = [...nvArray.value] // trigger react signal for changes
        nv.createOnLocationChange() // TODO fix, still required?
        nv.onVolumeUpdated()
        notifyImageLoaded()
      })
      .catch((error) => {
        console.error('Load Error:', error)
        nv.loadError = error.message || 'Unknown error loading file'
        nv.isLoading = false
        nv.body = null
        nvArray.value = [...nvArray.value] // trigger react signal for changes
      })
  }, [nv.body])

  if (nv.isLoaded && nv.volumes.length > 0) {
    nv.setSliceType(sliceType.value)
  }

  useEffect(() => {
    nv.drawScene()
  }, [height, width]) // avoids black images

  useEffect(() => {
    if (!nv.canvas) {
      return
    }
    // Apply settings reactively
    nv.setInterpolation(!settings.value.interpolation)
    try {
      nv.setCrosshairWidth(Number(settings.value.showCrosshairs))
    } catch (e) {
      console.warn('Failed to set crosshair width', e)
    }
    nv.setRadiologicalConvention(settings.value.radiologicalConvention)
    nv.opts.isColorbar = settings.value.colorbar
    nv.drawScene()
  }, [settings.value, nv.canvas])

  return (
    <div
      className="relative"
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute inset-0 w-full h-full object-contain"
      ></canvas>
    </div>
  )
}

async function getMinimalHeaderMHA() {
  const matrixSize = await getUserInput()
  if (!matrixSize) {
    return null
  }
  const dim = matrixSize.split(' ').length - 1
  const type = matrixSize.split(' ').pop()?.toUpperCase()
  const header = `ObjectType = Image\nNDims = ${dim}\nDimSize = ${matrixSize}\nElementType = MET_${type}\nElementDataFile = image.raw`
  return new TextEncoder().encode(header).buffer
}

async function getUserInput() {
  const defaultInput = '64 64 39 float'

  // create a dialog with a close button
  const input = document.createElement('input')
  input.value = defaultInput
  const dialog = document.createElement('dialog')
  const button = document.createElement('button')
  button.textContent = 'Submit file info'
  button.onclick = () => dialog.close()
  dialog.appendChild(input)
  dialog.appendChild(button)
  document.body.appendChild(dialog)
  dialog.showModal()

  // wait for click on the close button
  await new Promise((resolve) => (button.onclick = resolve))
  const matrixSize = input.value
  dialog.close()
  document.body.removeChild(dialog)
  return matrixSize
}

const ensureArrayBuffer = (data: any) => {
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'number') {
    return new Uint8Array(data).buffer
  }
  return data
}

// True for names without any extension ("IM_0001") or DICOM UID-style names
// made of digits and dots ("1.2.840.113619...101"). Used to decide whether a
// URL without data is worth fetching for a DICOM magic-byte sniff; mesh
// names like "lh.pial" or "brain.obj" stay on the streaming URL path.
const looksExtensionless = (uri: string) => {
  const basename = uri.split('?')[0].split('/').pop() ?? ''
  return !basename.includes('.') || /^[\d.]+$/.test(basename)
}

// Load one or more DICOM files as a single series. dcm2niix groups the
// slices and returns one NIfTI per series; the first series fills this canvas
// and any further series (a folder holding multiple acquisitions) are
// re-emitted through the normal pipeline so each opens on its own canvas.
async function loadDicomSeries(
  nv: ExtendedNiivue,
  uris: string[],
  datas: any,
  settings: NiiVueSettings,
) {
  const names = uris.map((u) => String(u).replace('.ima', '.dcm').replace('.IMA', '.dcm'))
  const data = Array.isArray(datas) ? [...datas] : [datas]
  // Fetch any missing buffers (e.g. plain URLs without inlined data).
  for (let i = 0; i < names.length; i++) {
    if (!data[i] && names[i].startsWith('http')) {
      const response = await fetch(names[i])
      data[i] = await response.arrayBuffer()
    }
  }
  const dicomInput = names.map((name, i) => ({ data: ensureArrayBuffer(data[i]), name }))
  const loadedFiles = await dicomLoader(dicomInput)
  if (!loadedFiles || loadedFiles.length === 0) {
    throw new Error('No DICOM volume could be decoded from the provided files')
  }
  const [first, ...rest] = loadedFiles
  const volume = await NVImage.loadFromUrl({
    url: first.data,
    name: first.name,
    colormap: settings.defaultVolumeColormap,
  })
  nv.addVolume(volume)
  // Extra series are already-decoded NIfTI buffers; route them back through
  // the image pipeline so each gets its own canvas.
  for (const file of rest) {
    window.postMessage({ type: 'addImage', body: { data: file.data, uri: file.name } })
  }
}

async function loadVolume(nv: ExtendedNiivue, item: any, settings: NiiVueSettings) {
  // Multi-file DICOM series: item.uri is an array of slice names with
  // item.data an array of buffers. Handle this first, because the single-file
  // string heuristics below call string methods on item.uri and would throw
  // on an array.
  if (Array.isArray(item.uri)) {
    await loadDicomSeries(nv, item.uri, item.data, settings)
    return
  }
  const isMincFile = (uri: string) => {
    const lowerUri = uri.toLowerCase()
    return lowerUri.endsWith('.mnc') || lowerUri.endsWith('.mnc.gz')
  }
  if (isMincFile(item.uri)) {
    nv.useLoader(mnc2nii, 'mnc', 'nii')
    if (item.data) {
      const image = {
        name: item.uri,
        url: item.data,
        colormap: settings.defaultVolumeColormap,
      }
      await nv.loadImages([image])
      return
    }
  }

  if (isImageType(item.uri) && !item.data && !item.uri.endsWith('.dcm')) {
    // If the item is an image type but has no data, load it from the URL.
    // Pass urlImgData so NiiVue can fetch the paired raw file for detached
    // formats like MHD (ElementDataFile = <name>.raw).
    const image = {
      url: item.uri,
      colormap: settings.defaultVolumeColormap,
      ...(item.urlImgData ? { urlImgData: item.urlImgData } : {}),
    }
    await nv.loadImages([image])
    return
  }

  // Read .ima and .IMA as dicom files (array form handled by loadDicomSeries)
  if (item.uri.endsWith('.ima') || item.uri.endsWith('.IMA')) {
    item.uri = item.uri.replace('.ima', '.dcm').replace('.IMA', '.dcm')
  }
  // DICOM files often have no extension (scanner exports may use bare
  // numbers or UIDs as names). When the name matches no known image format,
  // sniff the DICOM magic bytes and route matches through the DICOM loader.
  if (!item.uri.endsWith('.dcm') && !isImageType(item.uri)) {
    if (!item.data && item.uri.startsWith('http') && looksExtensionless(item.uri)) {
      // No bytes to sniff (e.g. webview resource URL), so fetch them. The
      // buffer is reused below; the file is not downloaded twice.
      try {
        const response = await fetch(item.uri)
        item.data = await response.arrayBuffer()
      } catch {
        // leave item.data unset; the fallback paths report the failure
      }
    }
    if (isDicomData(item.data)) {
      item.uri += '.dcm'
    }
  }
  // Handle different file types
  if (item.uri.endsWith('.dcm')) {
    await loadDicomSeries(nv, [item.uri], [item.data], settings)
  } else if (item.uri.endsWith('.raw')) {
    const header = await getMinimalHeaderMHA()
    if (!header) {
      return
    }
    const volume = await NVImage.loadFromUrl({
      url: header as ArrayBuffer,
      name: `${item.uri}.mha`,
      colormap: settings.defaultVolumeColormap,
      opacity: 1.0,
    })
    nv.addVolume(volume)
  } else if ((item?.data?.length ?? item?.data?.byteLength) > 0) {
    const isBuffer = typeof item.data.byteLength === 'number'

    if (isBuffer && isImageType(item.uri)) {
      // Handle TypedArray views (e.g. Uint8Array with byteOffset) vs raw ArrayBuffer
      let buffer: ArrayBuffer
      if (item.data instanceof ArrayBuffer) {
        buffer = item.data
      } else if (item.data.buffer instanceof ArrayBuffer) {
        // TypedArray view - extract the relevant slice
        buffer = item.data.buffer.slice(item.data.byteOffset, item.data.byteOffset + item.data.byteLength)
      } else {
        buffer = item.data.buffer
      }
      if (item.pairedData) {
        // Detached format (e.g. MHD + .raw): wrap the raw pixel data in a
        // temporary Blob URL so NiiVue can fetch it as urlImgData.
        const rawPaired: unknown = item.pairedData
        const pairedBuffer: ArrayBuffer =
          rawPaired instanceof ArrayBuffer
            ? rawPaired
            : new Uint8Array(rawPaired as number[]).buffer
        const blobUrl = URL.createObjectURL(new Blob([pairedBuffer]))
        try {
          const volume = await NVImage.loadFromUrl({
            url: buffer,
            urlImgData: blobUrl,
            name: item.uri,
            colormap: settings.defaultVolumeColormap,
          })
          nv.addVolume(volume)
        } finally {
          URL.revokeObjectURL(blobUrl)
        }
      } else {
        await nv.loadFromArrayBuffer(buffer, item.uri)
      }
    } else if (isBuffer && !isImageType(item.uri)) {
      const mesh = await NVMesh.readMesh(item.data, item.uri, nv.gl)
      nv.addMesh(mesh)
    } else if (typeof item.data === 'string') {
      const volume = await NVImage.loadFromUrl({
        url: item.data,
        name: item.uri,
        colormap: settings.defaultVolumeColormap,
      })
      nv.addVolume(volume)
    } else {
      console.warn('Unknown data type for loadVolume:', item.data)
    }
  } else if (isImageType(item.uri)) {
    if (item.data) {
      const volume = await NVImage.loadFromUrl({
        url: item.data,
        name: item.uri,
        colormap: settings.defaultVolumeColormap,
      })
      nv.addVolume(volume)
    } else {
      const volumeList = [{ url: item.uri, colormap: settings.defaultVolumeColormap }]
      await nv.loadVolumes(volumeList)
    }
  } else if (item.data) {
    const mesh = await NVMesh.readMesh(item.data, item.uri, nv.gl)
    nv.addMesh(mesh)
  } else {
    const meshList = [{ url: item.uri }]
    await nv.loadMeshes(meshList)
  }
}
