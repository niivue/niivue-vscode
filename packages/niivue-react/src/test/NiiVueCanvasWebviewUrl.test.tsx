import { signal } from '@preact/signals'
import { cleanup, render, waitFor } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// NiiVue fetches URLs in a Web Worker, which a VS Code webview cannot serve, so
// webview resource URLs must reach NiiVue as Files fetched on the main thread.

vi.mock('../dicom', () => ({ dicomToNifti: vi.fn() }))
vi.mock('@niivue/minc-loader', () => ({ mnc2nii: vi.fn() }))

vi.mock('@niivue/niivue', () => {
  class NiiVueGPU {
    canvas: HTMLCanvasElement | null = null
    volumes: unknown[] = []
    meshes: unknown[] = []
    sliceType = 3
    attachToCanvas = vi.fn((canvas: HTMLCanvasElement) => {
      this.canvas = canvas
      return Promise.resolve()
    })
    addEventListener = vi.fn()
    loadVolumes = vi.fn(() => Promise.resolve(undefined))
    loadMeshes = vi.fn(() => Promise.resolve(undefined))
    addVolume = vi.fn(() => Promise.resolve(undefined))
    drawScene = vi.fn()
    createOnLocationChange = vi.fn()
  }
  return {
    __esModule: true,
    default: NiiVueGPU,
    SLICE_TYPE: { AXIAL: 0, CORONAL: 1, SAGITTAL: 2, MULTIPLANAR: 3, RENDER: 4 },
    DRAG_MODE: { none: 0, crosshair: 8 },
  }
})

import { NiiVueCanvas } from '../components/NiiVueCanvas'
import { ExtendedNiivue } from '../events'
import { defaultSettings } from '../settings'

const resource = (name: string) => `https://file+.vscode-resource.vscode-cdn.net/d%3A/study/${name}`
const MHD_WITHOUT_TRANSFORM =
  'ObjectType = Image\nNDims = 3\nDimSize = 4 4 4\nElementType = MET_UCHAR\nElementDataFile = scan.raw\n'

function mountWithBody(body: object) {
  const nv = new ExtendedNiivue({}) as any
  nv.onVolumeUpdated = vi.fn()
  nv.body = body
  render(
    <NiiVueCanvas
      nv={nv}
      width={100}
      height={100}
      render={signal(0)}
      nvArray={signal<any[]>([nv])}
      sliceType={signal(3)}
      settings={signal({ ...defaultSettings })}
      {...({} as any)}
    />,
  )
  return nv
}

describe('NiiVueCanvas with webview resource URLs', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(new Uint8Array(400))),
    )
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('hands NiiVue a File for a volume and its detached data file', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.endsWith('.mhd')
          ? // A Blob of the test's own realm: Node's Response.blob() is not one on every Node.
            { ok: true, blob: async () => new Blob([MHD_WITHOUT_TRANSFORM]) }
          : new Response(new Uint8Array(400)),
      ),
    )
    const nv = mountWithBody({ uri: resource('scan.mhd'), urlImgData: resource('scan.raw') })

    await waitFor(() => expect(nv.loadVolumes).toHaveBeenCalled())
    const [[image]] = nv.loadVolumes.mock.calls[0]
    expect(image.url).toBeInstanceOf(File)
    expect(image.url.name).toBe('scan.mhd')
    expect(await image.url.text()).toContain('TransformMatrix = 1 0 0 0 1 0 0 0 1')
    expect(image.urlImageData).toBeInstanceOf(File)
    expect(image.urlImageData.name).toBe('scan.raw')
    expect(nv.loadError).toBe('')
  })

  it('hands NiiVue a File for a mesh', async () => {
    const nv = mountWithBody({ uri: resource('lh.pial') })

    await waitFor(() => expect(nv.loadMeshes).toHaveBeenCalled())
    const [[mesh]] = nv.loadMeshes.mock.calls[0]
    expect(mesh.url).toBeInstanceOf(File)
    expect(mesh.url.name).toBe('lh.pial')
  })

  it('hands NiiVue a headerless .raw file with a header built from the entered size', async () => {
    HTMLDialogElement.prototype.showModal ??= function () {}
    HTMLDialogElement.prototype.close ??= function () {}
    const nv = mountWithBody({ uri: resource('mask.raw') })

    const input = await waitFor(() => {
      const found = document.querySelector('dialog input') as HTMLInputElement | null
      expect(found).not.toBeNull()
      return found!
    })
    input.value = '58 58 21 float'
    ;(document.querySelector('dialog button') as HTMLButtonElement).click()

    await waitFor(() => expect(nv.addVolume).toHaveBeenCalled())
    const [[options]] = nv.addVolume.mock.calls
    expect(await options.url.text()).toContain('DimSize = 58 58 21\n')
    expect(options.urlImageData).toBeInstanceOf(File)
    expect(options.urlImageData.name).toBe('mask.raw')
    expect(nv.loadError).toBe('')
  })

  it('adds the missing TransformMatrix to an MHD sent as bytes', async () => {
    const nv = mountWithBody({
      uri: 'scan.mhd',
      data: Uint8Array.from(MHD_WITHOUT_TRANSFORM, (c) => c.charCodeAt(0)).buffer,
      pairedData: new Uint8Array(64).buffer,
    })

    await waitFor(() => expect(nv.addVolume).toHaveBeenCalled())
    const [[options]] = nv.addVolume.mock.calls
    expect(await options.url.text()).toContain('TransformMatrix = 1 0 0 0 1 0 0 0 1')
  })

  it('shows an error instead of loading forever when the .raw dialog is dismissed', async () => {
    HTMLDialogElement.prototype.showModal ??= function () {}
    HTMLDialogElement.prototype.close ??= function () {}
    const nv = mountWithBody({ uri: resource('mask.raw') })

    const dialog = await waitFor(() => {
      const found = document.querySelector('dialog')
      expect(found).not.toBeNull()
      return found!
    })
    dialog.dispatchEvent(new Event('cancel'))

    await waitFor(() => expect(nv.loadError).toContain('Enter the size and data type'))
    expect(nv.addVolume).not.toHaveBeenCalled()
  })

  it('passes other URLs through for NiiVue to fetch', async () => {
    const url = 'https://niivue.github.io/niivue-demo-images/mni152.nii.gz'
    const nv = mountWithBody({ uri: url })

    await waitFor(() => expect(nv.loadVolumes).toHaveBeenCalled())
    expect(nv.loadVolumes.mock.calls[0][0][0].url).toBe(url)
  })
})
