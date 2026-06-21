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
import { Signal } from '@preact/signals'
import { useEffect, useRef } from 'preact/hooks'
import { ExtendedNiivue, notifyImageLoaded } from '../events'
import { isNiftiName, NIFTI_PEEK_BYTES, niftiTooLargeWarning } from '../nifti'
import { NiiVueSettings } from '../settings'
import { graphmlToConnectome, isDicomData, isImageType } from '../utility'
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
    if (!canvasRef.current || nv.canvas) {
      return
    }
    // v1: attachToCanvas is async (returns a Promise). Wire the native
    // 'frameChange' event to onFrameUpdate once attached - this replaces the old
    // ExtendedNiivue.setFrame4D override and fires for every frame change.
    nv.attachToCanvas(canvasRef.current).then(() => {
      nv.addEventListener('frameChange', (e) => nv.onFrameUpdate(e.detail.frame))
    })
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

  // Import a niivue scene document (.nvd). Mirrors the nv.body path above: runs
  // after the canvas/GL is attached, so nv.loadDocument has a context to use.
  useEffect(() => {
    if (!nv.documentData || nv.isLoading) {
      return
    }
    const docFile = nv.documentData
    nv.isLoading = true
    // v1: nv.loadDocument takes a string | File. document.ts hands us the `.nvd`
    // CBOR bytes already wrapped in a File, so we load it directly (no JSON layer).
    nv.loadDocument(docFile)
      .then(() => {
        nv.isLoaded = true
        nv.isLoading = false
        nv.documentData = null
        render.value++ // required to update the names
        nvArray.value = [...nvArray.value] // trigger react signal for changes
        nv.createOnLocationChange()
        nv.onVolumeUpdated()
        notifyImageLoaded()
      })
      .catch((error) => {
        console.error('Load Document Error:', error)
        nv.loadError = error.message || 'Unknown error loading document'
        nv.isLoading = false
        nv.documentData = null
        nvArray.value = [...nvArray.value] // trigger react signal for changes
      })
  }, [nv.documentData])

  if (nv.isLoaded && nv.volumes.length > 0) {
    nv.sliceType = sliceType.value
  }

  useEffect(() => {
    nv.drawScene()
  }, [height, width]) // avoids black images

  useEffect(() => {
    if (!nv.canvas) {
      return
    }
    // Apply settings reactively
    nv.volumeIsNearestInterpolation = !settings.value.interpolation
    try {
      nv.crosshairWidth = Number(settings.value.showCrosshairs)
    } catch (e) {
      console.warn('Failed to set crosshair width', e)
    }
    nv.isRadiological = settings.value.radiologicalConvention
    nv.isColorbarVisible = settings.value.colorbar
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
  // v1: addVolume takes load options; url is string | File, so wrap the decoded
  // NIfTI buffer in a File (keep first.name so niivue infers the format).
  await nv.addVolume({
    url: new File([ensureArrayBuffer(first.data)], first.name),
    name: first.name,
    colormap: settings.defaultVolumeColormap,
  })
  // Extra series are already-decoded NIfTI buffers; route them back through
  // the image pipeline so each gets its own canvas.
  for (const file of rest) {
    window.postMessage({ type: 'addImage', body: { data: file.data, uri: file.name } })
  }
}

// Read just the leading bytes of a URL, then abort the rest of the download.
// Used to inspect a NIfTI header without streaming the whole (multi-GB) file.
async function fetchHeaderBytes(url: string, maxBytes = NIFTI_PEEK_BYTES): Promise<Uint8Array | null> {
  try {
    const response = await fetch(url)
    if (!response.ok || !response.body) {
      return null
    }
    const reader = response.body.getReader()
    const chunks: Uint8Array[] = []
    let total = 0
    try {
      while (total < maxBytes) {
        const { value, done } = await reader.read()
        if (done) {
          break
        }
        if (value) {
          chunks.push(value)
          total += value.byteLength
        }
      }
    } finally {
      reader.cancel().catch(() => {})
    }
    if (total === 0) {
      return null
    }
    const out = new Uint8Array(total)
    let offset = 0
    for (const chunk of chunks) {
      out.set(chunk, offset)
      offset += chunk.byteLength
    }
    return out
  } catch {
    return null
  }
}

// Get the leading bytes of a NIfTI item for the size guard: a prefix of the
// in-memory buffer when present, otherwise a header-only fetch of the URL.
async function getNiftiHeaderBytes(item: any): Promise<ArrayBuffer | Uint8Array | null> {
  const data = item.data
  if (data && typeof data !== 'string') {
    if (data instanceof ArrayBuffer) {
      return data.byteLength > NIFTI_PEEK_BYTES ? data.slice(0, NIFTI_PEEK_BYTES) : data
    }
    if (ArrayBuffer.isView(data)) {
      const view = new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
      return view.subarray(0, NIFTI_PEEK_BYTES)
    }
    if (Array.isArray(data) && data.length > 0) {
      // Some postMessage bridges serialize buffers to plain number arrays.
      return new Uint8Array(data.slice(0, NIFTI_PEEK_BYTES))
    }
    return null
  }
  if (!data && typeof item.uri === 'string' && item.uri.startsWith('http')) {
    return fetchHeaderBytes(item.uri)
  }
  return null
}

// Decode a GraphML payload (drag/drop buffer, postMessage number array, or
// already-decoded string) to text.
function graphmlBytesToText(data: any): string {
  if (typeof data === 'string') {
    return data
  }
  if (data instanceof ArrayBuffer) {
    return new TextDecoder().decode(data)
  }
  if (ArrayBuffer.isView(data)) {
    return new TextDecoder().decode(data as ArrayBufferView)
  }
  if (Array.isArray(data)) {
    return new TextDecoder().decode(new Uint8Array(data))
  }
  throw new Error('Unsupported GraphML data type')
}

// Load a GraphML graph as a NiiVue connectome. The bytes come inlined
// (drag/drop, vscode binary payload) or must be fetched from a URL (webview
// resource, ?images= query parameter). NiiVue loads connectomes from a .jcon
// mesh, so the converted graph is wrapped in a .jcon File whose name lets the
// mesh loader detect the format and read it as bytes.
async function loadGraphmlConnectome(nv: ExtendedNiivue, item: any) {
  let text: string
  if (item.data) {
    text = graphmlBytesToText(item.data)
  } else {
    const response = await fetch(item.uri)
    if (!response.ok) {
      throw new Error(`Failed to fetch GraphML (${response.status} ${response.statusText})`)
    }
    text = await response.text()
  }
  const baseName = (item.uri.split('?')[0].split('/').pop() || 'graph').replace(/\.graphml$/i, '')
  const connectome = graphmlToConnectome(text)
  const jconName = `${baseName}.jcon`
  const file = new File([JSON.stringify(connectome)], jconName, { type: 'application/json' })
  await nv.addMesh({ url: file, name: jconName })
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
  // GraphML graphs (e.g. vessel skeletons) render as a NiiVue connectome.
  if (item.uri.split('?')[0].toLowerCase().endsWith('.graphml')) {
    await loadGraphmlConnectome(nv, item)
    return
  }
  // Guard: refuse NIfTI volumes whose uncompressed voxel data exceeds the ~2 GB
  // ArrayBuffer/WebGL-texture ceiling before NiiVue tries to allocate it - which
  // otherwise fails with "Array buffer allocation failed" or renders garbage.
  // This is the universal net for every host reaching here: in-memory buffers
  // (jupyter, streamlit, vscode binary) and URL streams (vscode local files)
  // alike. The browser file picker is guarded earlier, in
  // buildImageMessageBodies. See niivue/niivue-vscode#228.
  if (typeof item.uri === 'string' && isNiftiName(item.uri)) {
    const headerBytes = await getNiftiHeaderBytes(item)
    if (headerBytes) {
      const warning = await niftiTooLargeWarning(headerBytes, item.uri)
      if (warning) {
        throw new Error(warning)
      }
    }
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
        url: new File([ensureArrayBuffer(item.data)], item.uri),
        colormap: settings.defaultVolumeColormap,
      }
      await nv.loadVolumes([image])
      return
    }
  }

  if (isImageType(item.uri) && !item.data && !item.uri.endsWith('.dcm')) {
    // If the item is an image type but has no data, load it from the URL.
    // Pass urlImageData so NiiVue can fetch the paired raw file for detached
    // formats like MHD (ElementDataFile = <name>.raw).
    const image = {
      url: item.uri,
      colormap: settings.defaultVolumeColormap,
      ...(item.urlImgData ? { urlImageData: item.urlImgData } : {}),
    }
    await nv.loadVolumes([image])
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
    // v1: wrap the synthesized .mha header bytes in a File (the .mha name lets
    // niivue parse it; ElementDataFile points at the .raw the user dropped).
    await nv.addVolume({
      url: new File([header], `${item.uri}.mha`),
      name: `${item.uri}.mha`,
      colormap: settings.defaultVolumeColormap,
      opacity: 1.0,
    })
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
        // temporary Blob URL so NiiVue can fetch it as urlImageData.
        const rawPaired: unknown = item.pairedData
        const pairedBuffer: ArrayBuffer =
          rawPaired instanceof ArrayBuffer
            ? rawPaired
            : new Uint8Array(rawPaired as number[]).buffer
        const blobUrl = URL.createObjectURL(new Blob([pairedBuffer]))
        try {
          // v1: url is string | File; wrap the header buffer in a File named for
          // the .mhd so niivue parses the detached format, urlImageData = the raw.
          await nv.addVolume({
            url: new File([buffer], item.uri),
            urlImageData: blobUrl,
            name: item.uri,
            colormap: settings.defaultVolumeColormap,
          })
        } finally {
          URL.revokeObjectURL(blobUrl)
        }
      } else {
        await nv.addVolume({ url: new File([buffer], item.uri), name: item.uri })
      }
    } else if (isBuffer && !isImageType(item.uri)) {
      await nv.addMesh({ url: new File([ensureArrayBuffer(item.data)], item.uri), name: item.uri })
    } else if (typeof item.data === 'string') {
      await nv.addVolume({
        url: item.data,
        name: item.uri,
        colormap: settings.defaultVolumeColormap,
      })
    } else {
      console.warn('Unknown data type for loadVolume:', item.data)
    }
  } else if (isImageType(item.uri)) {
    if (item.data) {
      await nv.addVolume({
        url: item.data,
        name: item.uri,
        colormap: settings.defaultVolumeColormap,
      })
    } else {
      const volumeList = [{ url: item.uri, colormap: settings.defaultVolumeColormap }]
      await nv.loadVolumes(volumeList)
    }
  } else if (item.data) {
    await nv.addMesh({ url: new File([ensureArrayBuffer(item.data)], item.uri), name: item.uri })
  } else {
    const meshList = [{ url: item.uri }]
    await nv.loadMeshes(meshList)
  }
}
