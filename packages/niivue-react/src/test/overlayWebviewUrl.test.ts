import { signal } from '@preact/signals'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppProps } from '../components/AppProps'

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

import { handleMessage } from '../events'

const resource = (name: string) => `https://file+.vscode-resource.vscode-cdn.net/d%3A/study/${name}`

function propsWithCanvas() {
  const nv = { addVolume: vi.fn(async () => {}), addMesh: vi.fn(async () => {}) }
  const props = {
    nvArray: signal([nv]),
    sliceType: signal(3),
    settings: signal({}),
  } as unknown as AppProps
  return { nv, props }
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(new Uint8Array(8))))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('overlays from webview resource URLs', () => {
  it('hands NiiVue a File for a volume overlay', async () => {
    const { nv, props } = propsWithCanvas()

    await handleMessage({ type: 'overlay', body: { uri: resource('mask.nii.gz'), index: 0 } }, props)

    const [[options]] = nv.addVolume.mock.calls as unknown as [[{ url: File }]]
    expect(options.url).toBeInstanceOf(File)
    expect(options.url.name).toBe('mask.nii.gz')
  })

  it('hands NiiVue a File for a mesh overlay', async () => {
    const { nv, props } = propsWithCanvas()

    await handleMessage({ type: 'overlay', body: { uri: resource('lh.pial'), index: 0 } }, props)

    const [[options]] = nv.addMesh.mock.calls as unknown as [[{ url: File }]]
    expect(options.url).toBeInstanceOf(File)
    expect(options.url.name).toBe('lh.pial')
  })
})
