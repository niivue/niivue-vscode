import { Niivue, NVImage, NVMesh } from '@niivue/niivue'
import { isImageType } from './utility'
import { SLICE_TYPE } from '@niivue/niivue'

export function listenToMessages(setNvArray: Function, setSliceType: Function) {
  async function messageListener(e) {
    setNvArray((nvArray) => {
      const { type, body } = e.data
      switch (type) {
        case 'addMeshOverlay':
          {
            addMeshOverlay(nvArray[body.index], body, 'overlay')
          }
          break
        case 'addMeshCurvature':
          {
            addMeshOverlay(nvArray[body.index], body, 'curvature')
          }
          break
        case 'replaceMeshOverlay':
          {
            addMeshOverlay(nvArray[body.index], body, 'replaceOverlay')
          }
          break
        case 'overlay':
          {
            addOverlay(nvArray[body.index], body)
          }
          break
        case 'addImage':
          {
            const nv = getUnitinializedNvInstance(nvArray)
            nv.body = body
            nv.isNew = false
          }
          break
        case 'initCanvas':
          {
            if (nvArray.length + body.n > 1) {
              setSliceType(SLICE_TYPE.AXIAL)
            }
            growNvArrayBy(nvArray, body.n)
          }
          break
      }
      return [...nvArray] // triggers rerender after each received message
    })
  }
  window.onmessage = messageListener
}

interface LayerOptions {
  opacity?: number
  colormap?: string
  colormapNegative?: string
  useNegativeCmap?: boolean
  calMin?: number
  calMax?: number
}

export function addMeshOverlay(nv, item, type) {
  if (nv.meshes.length === 0) {
    return
  }

  const a: LayerOptions = {}
  switch (type) {
    case 'curvature':
      {
        a.opacity = 0.7
        a.colormap = 'gray'
        a.useNegativeCmap = false
        a.calMin = 0.3
        a.calMax = 0.5
      }
      break
    case 'overlay':
    case 'replaceOverlay':
      {
        a.opacity = 0.7
        a.colormap = 'hsv'
        a.colormapNegative = ''
        a.useNegativeCmap = false
      }
      break
  }
  const mesh = nv.meshes[0]
  if (type === 'replaceOverlay') {
    mesh.layers.pop()
  }
  NVMesh.readLayer(
    item.uri,
    item.data,
    mesh,
    a.opacity,
    a.colormap,
    a.colormapNegative,
    a.useNegativeCmap,
    a.calMin,
    a.calMax,
  )
  mesh.updateMesh(nv.gl)
  nv.opts.isColorbar = true
  nv.updateGLVolume()
  const layerNumber = nv.meshes[0].layers.length - 1
  if (type === 'curvature') {
    nv.setMeshLayerProperty(
      nv.meshes[0].id,
      layerNumber,
      'colorbarVisible',
      false,
    )
  }
}

export async function addOverlay(nv, item) {
  if (isImageType(item.uri)) {
    const image = new NVImage(item.data, item.uri, 'redyell', 0.5)
    nv.addVolume(image)
  } else {
    const mesh = await NVMesh.readMesh(item.data, item.uri, nv.gl, 0.5)
    nv.addMesh(mesh)
  }
}

export function addOverlayEvent(imageIndex, type) {
  if (typeof vscode === 'object') {
    vscode.postMessage({
      type: 'addOverlay',
      body: { type, index: imageIndex },
    })
  } else {
    const input = document.createElement('input')
    input.type = 'file'

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement)?.files?.[0]
      if (file) {
        file.arrayBuffer().then((data) => {
          window.postMessage({
            type,
            body: {
              data,
              uri: file.name,
              index: imageIndex,
            },
          })
        })
      }
    }
    input.click()
  }
}

export function addImagesEvent() {
  if (typeof vscode === 'object') {
    vscode.postMessage({ type: 'addImages' })
  } else {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    // input.accept = imageFileTypes;

    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement)?.files
      if (files && files.length > 0) {
        window.postMessage({
          type: 'initCanvas',
          body: {
            n: files.length,
          },
        })
        for (const file of files) {
          const data = await file.arrayBuffer()
          window.postMessage({
            type: 'addImage',
            body: {
              data,
              uri: file.name,
            },
          })
        }
      }
    }
    input.click()
  }
}

export function getUnitinializedNvInstance(nvArray) {
  const nv = nvArray.find((nv) => nv.isNew)
  if (nv) {
    return nv
  }
  growNvArrayBy(nvArray, 1)
  return nvArray[nvArray.length - 1]
}

export function growNvArrayBy(nvArray, n) {
  for (let i = 0; i < n; i++) {
    const nv = new Niivue({ isResizeCanvas: false })
    nv.isNew = true
    nv.isLoaded = false
    nvArray.push(nv)
  }
}
