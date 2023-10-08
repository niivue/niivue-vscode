import { SLICE_TYPE, NVImage, NVMesh } from '@niivue/niivue'
import { html } from 'htm/preact'
import { useRef, useEffect } from 'preact/hooks'
import { isImageType } from '../utility'

interface NiiVueCanvasProps {
  nv: Niivue
  setIntensity: Function
  width: number
  height: number
  setNv0: Function
  sliceType: number
  interpolation: boolean
  scaling: any
  setLocation: Function
  triggerRender: Function
  crosshair: number
}

export const NiiVueCanvas = ({
  nv,
  setIntensity,
  width,
  height,
  setNv0,
  sliceType,
  interpolation,
  scaling,
  setLocation,
  triggerRender,
  crosshair,
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
        setIntensityAndLocation(data, setIntensity, setLocation)
      nv.createOnLocationChange()
      setNv0((nv0: Niivue) => (nv0.isLoaded ? nv0 : nv))

      // simulate click on canvas to adjust aspect ratio of nv instance
      const canvas = canvasRef.current
      if (canvas) {
        const rect = canvas.getBoundingClientRect()
        const factor = sliceType === SLICE_TYPE.MULTIPLANAR ? 4 : 2
        const x = rect.left + rect.width / factor
        const y = rect.top + rect.height / factor
        await new Promise((resolve) => setTimeout(resolve, 100))
        canvas.dispatchEvent(
          new MouseEvent('mousedown', { clientX: x, clientY: y })
        )
        canvas.dispatchEvent(
          new MouseEvent('mouseup', { clientX: x, clientY: y })
        )
      }
      // sleep to avoid black images
      await new Promise((resolve) => setTimeout(resolve, 100))
      triggerRender()
    })
  }, [nv.body])
  useEffect(() => nv.setSliceType(sliceType), [sliceType])
  useEffect(() => nv.setInterpolation(!interpolation), [interpolation])
  useEffect(() => applyScale(nv, scaling), [scaling])
  useEffect(() => nv.isLoaded && nv.setCrosshairWidth(crosshair), [crosshair])

  return html`<canvas
    ref=${canvasRef}
    width=${width}
    height=${height}
  ></canvas>`
}
function getMinimalHeaderMHA() {
  const matrixSize = prompt('Please enter the matrix size:', '64 64 39 float')
  if (!matrixSize) {
    return null
  }
  const dim = matrixSize.split(' ').length - 1
  const type = matrixSize.split(' ').pop()?.toUpperCase()
  const header = `ObjectType = Image\nNDims = ${dim}\nDimSize = ${matrixSize}\nElementType = MET_${type}\nElementDataFile = image.raw`
  return new TextEncoder().encode(header).buffer
}

async function loadVolume(nv: Niivue, item: any) {
  if (item.uri.endsWith('.raw')) {
    const volume = new NVImage(
      getMinimalHeaderMHA(),
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
  setIntensity: Function,
  setLocation: Function
) {
  const parts = data.string.split('=')
  if (parts.length === 2) {
    setIntensity(parts.pop())
  }
  setLocation(parts.pop())
}
