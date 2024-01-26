import { Niivue, NVImage, NVMesh, NVMeshLoaders, SLICE_TYPE } from '@niivue/niivue'
import { isImageType } from './utility'
import { AppProps } from './components/App'
import { Signal } from '@preact/signals'

export function listenToMessages(appProps: AppProps) {
  const { nvArray, sliceType } = appProps
  window.onmessage = (e: any) => {
    const { type, body } = e.data
    switch (type) {
      case 'addMeshOverlay':
      case 'addMeshCurvature':
      case 'replaceMeshOverlay':
        {
          addMeshOverlay(nvArray.value[body.index], body, type)
        }
        break
      case 'overlay':
        {
          addOverlay(nvArray.value[body.index], body)
        }
        break
      case 'addImage':
        {
          const nv = getUnitinializedNvInstance(nvArray)
          nv.body = body
          nv.isNew = false
        }
        break
      case 'addDcmFiles':
        {
          const nv = getUnitinializedNvInstance(nvArray)
          readDcmFiles(nv, body.files)
        }
        break
      case 'initCanvas':
        {
          if (nvArray.value.length === 0 && body.n > 1) {
            sliceType.value = SLICE_TYPE.AXIAL
          }
          growNvArrayBy(nvArray, body.n)
        }
        break
      case 'debugRequest':
        {
          handleDebugMessage(body, appProps)
        }
        break
      default:
        return
    }
    nvArray.value = [...nvArray.value] // triggers rerender after each received message
  }
  if (typeof vscode === 'object') {
    vscode.postMessage({ type: 'ready' })
  }
  addImageFromURLParams()
}

function readDcmFiles(nv: ExtendedNiivue, files: File[]): void {
  if (files.length > 0) {
    const getFileObjects = async (fileList: File[]): Promise<File[]> => {
      return fileList // fileList is already an array of File objects
    }
    getFileObjects(files)
      .then((allFileObjects) => {
        NVImage.loadFromFile({
          file: allFileObjects, // an array of file objects
          name: allFileObjects[0].name, // Use the first filename
          urlImgData: null, // nothing
          imageType: 16, // DCM_FOLDER
        })
          .then((volume) => nv.addVolume(volume))
          .catch((e) => {
            throw e
          })
      })
      .catch((e) => {
        throw e
      })
  }
}

function handleDebugMessage(body: any, appProps: AppProps) {
  // sending arrays is fine, dataBuffer does not work
  // sending objects only works with one element inside
  const { nvArray } = appProps
  switch (body) {
    case 'getNCanvas':
      {
        window.postMessage({
          type: 'debugAnswer',
          body: nvArray.value.length,
        })
      }
      break
    case 'getMinMaxOfFirstImage':
      {
        window.postMessage({
          type: 'debugAnswer',
          body: [nvArray.value[0].volumes[0].cal_min, nvArray.value[0].volumes[0].cal_max],
        })
      }
      break
  }
}

export function openImageFromURL(uri: string) {
  window.postMessage({
    type: 'addImage',
    body: {
      data: '',
      uri,
    },
  })
}

function addImageFromURLParams() {
  const urlParams = new URLSearchParams(window.location.search)
  const imageURLs = urlParams.get('images')?.split(',') ?? []
  if (imageURLs.length > 0) {
    window.postMessage({
      type: 'initCanvas',
      body: {
        n: imageURLs.length,
      },
    })
    imageURLs.forEach((url) => {
      fetch(url)
        .then((response) => response.arrayBuffer())
        .then((data) => {
          window.postMessage({
            type: 'addImage',
            body: {
              data,
              uri: url,
            },
          })
        })
    })
  }
}

interface LayerOptions {
  opacity?: number
  colormap?: string
  colormapNegative?: string
  useNegativeCmap?: boolean
  calMin?: number
  calMax?: number
}

async function addMeshOverlay(nv: Niivue, item: any, type: string) {
  if (nv.meshes.length === 0) {
    return
  }

  const a = getLayerDefaults(type)
  const mesh = nv.meshes[0]
  if (type === 'replaceMeshOverlay') {
    mesh.layers.pop()
  }
  if (!item.data) {
    const response = await fetch(item.uri)
    if (!response.ok) {
      throw new Error(`Load mesh overlay error! status: ${response.status}`)
    }
    item.data = await response.arrayBuffer()
  }
  NVMeshLoaders.readLayer(
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
  if (type === 'addMeshCurvature') {
    nv.setMeshLayerProperty(nv.meshes[0].id as any, layerNumber, 'colorbarVisible', false as any)
  }
}

function getLayerDefaults(type: string) {
  const a: LayerOptions = {}
  switch (type) {
    case 'addMeshCurvature':
      {
        a.opacity = 0.7
        a.colormap = 'gray'
        a.useNegativeCmap = false
        a.calMin = 0.3
        a.calMax = 0.5
      }
      break
    case 'addMeshOverlay':
    case 'replaceMeshOverlay':
      {
        a.opacity = 0.7
        a.colormap = 'hsv'
        a.colormapNegative = ''
        a.useNegativeCmap = false
      }
      break
  }
  return a
}

function addOverlay(nv: Niivue, item: any) {
  if (isImageType(item.uri)) {
    const image = new NVImage(item.data, item.uri, 'redyell', 0.5)
    nv.addVolume(image)
  } else {
    const mesh = NVMesh.readMesh(item.data, item.uri, nv.gl, 0.5)
    nv.addMesh(mesh)
  }
}

export function addOverlayEvent(imageIndex: number, type: string) {
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
      const files = Array.from((e.target as HTMLInputElement)?.files ?? [])
      if (files.length > 0) {
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

export function addDcmFolderEvent() {
  if (typeof vscode === 'object') {
    vscode.postMessage({ type: 'addImages' })
  } else {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = false
    input.webkitdirectory = true

    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files ?? [])
      window.postMessage({
        type: 'addDcmFiles',
        body: {
          files: files,
        },
      })
    }

    input.click()
  }
}

function getUnitinializedNvInstance(nvArray: Signal<ExtendedNiivue[]>) {
  const nv = nvArray.value.find((nv) => nv.isNew)
  if (nv) {
    return nv
  }
  growNvArrayBy(nvArray, 1)
  return nvArray.value[nvArray.value.length - 1]
}

export class ExtendedNiivue extends Niivue {
  constructor(opts: any) {
    super(opts)
  }
  isNew = true
  isLoaded = false
  key = NaN
  body = null
  mouseMoveListener(e: MouseEvent) {
    super.mouseMoveListener(e)
    if (this.uiData.mouseButtonRightDown || this.uiData.mouseButtonCenterDown) {
      this.canvas?.focus()
      // handle the case where this.otherNV is of type Niivue
      console.log('trying to move ')
      console.log(this.uiData.mouseButtonCenterDown)
      console.log(this.uiData.isDragging)
      if (this.otherNV != null) {
        if (this.otherNV instanceof Niivue) {
          this.otherNV.scene.pan2Dxyzmm = this.scene.pan2Dxyzmm
          this.otherNV.drawScene()
        } else {
          this.otherNV.forEach((nv: Niivue) => {
            nv.scene.pan2Dxyzmm = this.scene.pan2Dxyzmm
            nv.drawScene()
          })
        }
      }
    }
  }
}

function growNvArrayBy(nvArray: Signal<Niivue[]>, n: number) {
  for (let i = 0; i < n; i++) {
    const nv = new ExtendedNiivue({
      isResizeCanvas: false,
      dragMode: 4,
    })
    nv.key = Math.random()
    nvArray.value = [...nvArray.value, nv]
  }
}
