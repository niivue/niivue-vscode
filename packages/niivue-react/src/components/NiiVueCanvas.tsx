import { NVImage, NVMesh } from '@niivue/niivue'
import { useRef, useEffect } from 'preact/hooks'
import { isImageType } from '../utility'
import { Signal } from '@preact/signals'
import { AppProps } from './App'
import { ExtendedNiivue } from '../events'
import { dicomLoader } from '@niivue/dicom-loader'

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
}: AppProps & NiiVueCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  
  useEffect(() => {
    canvasRef.current && !nv.canvas && nv.attachToCanvas(canvasRef.current)
  }, [canvasRef.current])
  
  useEffect(() => {
    if (!nv.body) {
      return
    }
    loadVolume(nv, nv.body).then(async () => {
      nv.isLoaded = true
      nv.body = null
      nv.createOnLocationChange()
      render.value++ // required to update the names
      nvArray.value = [...nvArray.value] // trigger react signal for changes
    })
  }, [nv.body])

  if (nv.isLoaded && nv.volumes.length > 0) {
    nv.setSliceType(sliceType.value)
  }

  useEffect(() => {
    nv.drawScene()
  }, [height, width]) // avoids black images

  return <canvas ref={canvasRef} width={width} height={height}></canvas>
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

async function loadVolume(nv: ExtendedNiivue, item: any) {
  // Read .ima and .IMA as dicom files
  if (Array.isArray(item.uri)) {
    item.uri = item.uri.map((uri: any) => uri.replace('.ima', '.dcm').replace('.IMA', '.dcm'))
  } else if (item.uri.endsWith('.ima') || item.uri.endsWith('.IMA')) {
    item.uri = item.uri.replace('.ima', '.dcm').replace('.IMA', '.dcm')
  }
  // Handle different file types
  if (Array.isArray(item.uri) || item.uri.endsWith('.dcm')) {
    if (!Array.isArray(item.uri)) {
      item.uri = [item.uri]
      item.data = [item.data]
    }
    const dicomInput = item.uri.map((uri: any, i: number) => ({
      data: item.data[i],
      name: uri,
    }))
    const loadedFiles = await dicomLoader(dicomInput)
    const volume = await NVImage.loadFromUrl({
      url: loadedFiles[0].data,
      name: loadedFiles[0].name,
    })
    nv.addVolume(volume)
  } else if (item.uri.endsWith('.raw')) {
    const header = await getMinimalHeaderMHA()
    if (!header) {
      return
    }
    const volume = await NVImage.new(header, `${item.uri}.mha`, 'gray', 1.0, item.data)
    nv.addVolume(volume)
  } else if (item?.data?.length > 0) {
    const volume = await NVImage.new(item.data, item.uri)
    nv.addVolume(volume)
  } else if (isImageType(item.uri)) {
    if (item.data) {
      const volume = await NVImage.new(item.data, item.uri)
      nv.addVolume(volume)
    } else {
      const volumeList = [{ url: item.uri }]
      await nv.loadVolumes(volumeList)
    }
  } else if (item.data) {
    const mesh = await NVMesh.readMesh(item.data, item.uri, nv.gl)
    nv.addMesh(mesh)
  } else {
    const meshList = [{ url: item.uri }]
    nv.loadMeshes(meshList)
  }
}
