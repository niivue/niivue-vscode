import { signal } from '@preact/signals'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AppProps } from '../components/AppProps'

// jsdom has no WebGL; the canvases these messages create only need to exist.
vi.mock('@niivue/niivue', () => {
  class NiiVueGPU {
    constructor(_opts?: unknown) {}
  }
  return {
    __esModule: true,
    default: NiiVueGPU,
    SLICE_TYPE: { AXIAL: 0, CORONAL: 1, SAGITTAL: 2, MULTIPLANAR: 3, RENDER: 4 },
    DRAG_MODE: { crosshair: 8 },
  }
})

import { ExtendedNiivue, handleMessage, loadDocumentEvent } from '../events'

function makeProps() {
  return {
    nvArray: signal([]),
    sliceType: signal(3),
    settings: signal({}),
  } as unknown as AppProps
}

const firstCanvas = (props: AppProps) => props.nvArray.value[0] as ExtendedNiivue

afterEach(() => {
  delete (globalThis as any).vscode
  vi.restoreAllMocks()
})

describe('scene documents sent as images', () => {
  it('loads a .nvd body as a document from its bytes', async () => {
    const props = makeProps()
    const data = new ArrayBuffer(4)

    await handleMessage({ type: 'addImage', body: { data, uri: 'scans/scene.nvd' } }, props)

    expect(firstCanvas(props).documentData).toEqual({ name: 'scans/scene.nvd', data })
    expect(firstCanvas(props).body).toBeNull()
  })

  it('fetches a document that arrives as a URL only', async () => {
    const props = makeProps()
    const uri = 'https://file.vscode-resource.example/scans/scene.nvd.json?v=2'

    await handleMessage({ type: 'addImage', body: { data: '', uri } }, props)

    expect(firstCanvas(props).documentData).toEqual({ name: uri, url: uri })
  })

  it('still loads other files as images', async () => {
    const props = makeProps()
    const body = { data: new ArrayBuffer(4), uri: 'brain.nii.gz' }

    await handleMessage({ type: 'addImage', body }, props)

    expect(firstCanvas(props).body).toBe(body)
    expect(firstCanvas(props).documentData).toBeNull()
  })

  it('keeps a DICOM series, whose uri is a list, on the image path', async () => {
    const props = makeProps()
    const body = { data: [new ArrayBuffer(4)], uri: ['a.nvd'] }

    await handleMessage({ type: 'addImage', body }, props)

    expect(firstCanvas(props).body).toBe(body)
  })

  it('hands loadDocument bytes to the canvas', async () => {
    const props = makeProps()
    const document = new Uint8Array([1, 2, 3])

    await handleMessage({ type: 'loadDocument', body: { document, name: 'scene.nvd' } }, props)

    expect(firstCanvas(props).documentData).toEqual({ name: 'scene.nvd', data: document })
  })
})

describe('loadDocumentEvent', () => {
  it('asks a webview host to show its own open dialog', () => {
    const postMessage = vi.fn()
    ;(globalThis as any).vscode = { postMessage }

    loadDocumentEvent()

    expect(postMessage).toHaveBeenCalledWith({ type: 'openDocument' })
  })

  it('offers .nvd and JSON files in the browser file picker', () => {
    const accepted: string[] = []
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (
      this: HTMLInputElement,
    ) {
      accepted.push(this.accept)
    })

    loadDocumentEvent()

    expect(accepted).toEqual(['.nvd,.json'])
  })
})
