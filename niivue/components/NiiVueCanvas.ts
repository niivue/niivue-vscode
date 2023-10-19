import { NVImage, NVMesh } from '@niivue/niivue'
import { html } from 'htm/preact'
import { useRef, useEffect } from 'preact/hooks'
import { isImageType } from '../utility'
import { Signal } from '@preact/signals'
import { AppProps } from './App'

interface NiiVueCanvasProps {
  nv: Niivue
  intensity: Signal<string>
  width: number
  height: number
  triggerRender: Function
}

export const NiiVueCanvas = ({
  nv,
  intensity,
  width,
  height,
  nv0,
  sliceType,
  interpolation,
  scaling,
  location,
  triggerRender,
  crosshair,
  radiologicalConvention,
}: AppProps & NiiVueCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>()
  useEffect(() => nv.attachToCanvas(canvasRef.current), [])
  useEffect(() => {
    if (!nv.body) {
      return
    }
    loadVolume(nv, nv.body).then(async () => {
      nv.isLoaded = true
      nv.body = null
      nv.onLocationChange = (data: any) =>
        setIntensityAndLocation(data, intensity, location)
      nv.createOnLocationChange()
      if (!nv0.value.isLoaded) {
        nv0.value = nv
      }
      triggerRender() // required to update the names
    })
  }, [nv.body])

  if (nv.isLoaded && nv.volumes.length > 0) {
    nv.setSliceType(sliceType.value)
    nv.setInterpolation(!interpolation.value)
    nv.setRadiologicalConvention(radiologicalConvention.value)
    try {
      nv.setCrosshairWidth(crosshair.value)
    } catch (e) {
      console.log(e) // sometime fails
    }
    applyScale(nv, scaling.value)
  }

  useEffect(() => nv.drawScene(), [height, width]) // avoids black images

  return html`<canvas
    ref=${canvasRef}
    width=${width}
    height=${height}
  ></canvas>`
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

async function loadVolume(nv: Niivue, item: any) {
  if (item.uri.endsWith('.raw')) {
    const header = await getMinimalHeaderMHA()
    if (!header) {
      return
    }
    const volume = new NVImage(
      header,
      `${item.uri}.mha`,
      'gray',
      1.0,
      item.data
    )
    nv.addVolume(volume)
  } else if (isImageType(item.uri)) {
    if (item.data) {
      const volume = new NVImage(item.data, item.uri)
      nv.addVolume(volume)
    } else {
      const volumeList = [{ url: item.uri }]
      await nv.loadVolumes(volumeList)
    }
  } else if (item.data) {
    NVMesh.readMesh(item.data, item.uri, nv.gl).then((mesh: any) => {
      nv.addMesh(mesh)
    })
  } else {
    const meshList = [{ url: item.uri }]
    nv.loadMeshes(meshList)
  }
}

export function applyScale(nv: Niivue, scaling: any) {
  if (scaling.isManual) {
    nv.volumes[0].cal_min = scaling.min
    nv.volumes[0].cal_max = scaling.max
    nv.updateGLVolume()
  }
}

function setIntensityAndLocation(
  data: any,
  intensity: Signal<string>,
  location: Signal<string>
) {
  const parts = data.string.split('=')
  if (parts.length === 2) {
    intensity.value = parts.pop()
  }
  location.value = parts.pop()
}
