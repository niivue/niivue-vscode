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
    const nv = mountWithBody({ uri: resource('scan.mhd'), urlImgData: resource('scan.raw') })

    await waitFor(() => expect(nv.loadVolumes).toHaveBeenCalled())
    const [[image]] = nv.loadVolumes.mock.calls[0]
    expect(image.url).toBeInstanceOf(File)
    expect(image.url.name).toBe('scan.mhd')
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

  it('passes other URLs through for NiiVue to fetch', async () => {
    const url = 'https://niivue.github.io/niivue-demo-images/mni152.nii.gz'
    const nv = mountWithBody({ uri: url })

    await waitFor(() => expect(nv.loadVolumes).toHaveBeenCalled())
    expect(nv.loadVolumes.mock.calls[0][0][0].url).toBe(url)
  })
})
