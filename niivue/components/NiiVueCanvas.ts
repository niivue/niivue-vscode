import { NVImage, NVMesh } from '@niivue/niivue'
import { html } from 'htm/preact'
import { useRef, useEffect } from 'preact/hooks'
import { isImageType } from '../utility'
import { Signal, effect } from '@preact/signals'

interface NiiVueCanvasProps {
  nv: Niivue
  intensity: Signal<string>
  width: number
  height: number
  setNv0: Function
  sliceType: number
  interpolation: boolean
  scaling: any
  location: Signal<string>
  triggerRender: Function
  crosshair: boolean
  radiologicalConvention: Signal<boolean>
}

export const NiiVueCanvas = ({
  nv,
  intensity,
  width,
  height,
  setNv0,
  sliceType,
  interpolation,
  scaling,
  location,
  triggerRender,
  crosshair,
  radiologicalConvention,
}: NiiVueCanvasProps) => {
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
      setNv0((nv0: Niivue) => (nv0.isLoaded ? nv0 : nv))
      triggerRender() // required to update the names
    })
  }, [nv.body])
  useEffect(() => nv.setSliceType(sliceType), [sliceType])
  useEffect(() => nv.setInterpolation(!interpolation), [interpolation])
  useEffect(() => applyScale(nv, scaling), [scaling])
  useEffect(() => nv.isLoaded && nv.setCrosshairWidth(crosshair), [crosshair])
  if (nv.isLoaded) {
    effect(() => nv.setRadiologicalConvention(radiologicalConvention.value))
  }
  useEffect(() => nv.drawScene(), [height, width])

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
