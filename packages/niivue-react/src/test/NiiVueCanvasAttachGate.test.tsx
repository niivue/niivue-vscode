import { signal } from '@preact/signals'
import { render, waitFor } from '@testing-library/preact'
import { describe, expect, it, vi } from 'vitest'

/**
 * Regression test for the intermittent "Failed to load image" seen when adding
 * several volumes in a row (niivue/niivue-vscode: image loading failures).
 *
 * `nv.attachToCanvas()` sets `nv.view` synchronously but only awaits
 * `view.init()` (GPU device, buffers, pipelines) afterwards, and
 * `nv.addVolume -> updateGLVolume -> view.updateBindGroups()` only guards on
 * `nv.view` being set. A volume whose decode finishes while init is still in
 * flight therefore hit a half-initialized view and threw
 * "createBindGroup ... 'buffer' ... Required member is undefined".
 *
 * NiiVueCanvas must not start a load until the attach promise has resolved.
 */

vi.mock('@niivue/dcm2niix', () => ({ Dcm2niix: class { init() {} } }))
vi.mock('dcm2niix-worker', () => ({ default: 'blob:dcm2niix-worker' }))
vi.mock('@niivue/dicom-loader', () => ({ dicomLoader: vi.fn() }))
vi.mock('@niivue/minc-loader', () => ({ mnc2nii: vi.fn() }))

const calls: string[] = []
let resolveAttach: () => void

vi.mock('@niivue/niivue', () => {
  class NiiVueGPU {
    canvas: HTMLCanvasElement | null = null
    volumes: unknown[] = []
    meshes: unknown[] = []
    sliceType = 3
    attachToCanvas = vi.fn((canvas: HTMLCanvasElement) => {
      calls.push('attach:start')
      this.canvas = canvas
      return new Promise<void>((resolve) => {
        resolveAttach = () => {
          calls.push('attach:done')
          resolve()
        }
      })
    })
    addEventListener = vi.fn()
    addVolume = vi.fn(() => {
      calls.push('addVolume')
      return Promise.resolve(undefined)
    })
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

// Import AFTER the mocks are registered.
import { NiiVueCanvas } from '../components/NiiVueCanvas'
import { ExtendedNiivue } from '../events'
import { defaultSettings } from '../settings'

describe('NiiVueCanvas attach gate', () => {
  it('does not call addVolume until attachToCanvas has resolved', async () => {
    const nv = new ExtendedNiivue({}) as any
    // .nrrd skips the NIfTI header peek; the buffer path still ends in addVolume.
    nv.body = { data: new ArrayBuffer(64), uri: 'volume.nrrd' }
    nv.onVolumeUpdated = vi.fn()

    const nvArray = signal([nv])
    render(
      <NiiVueCanvas
        nv={nv}
        width={100}
        height={100}
        render={signal(0)}
        nvArray={nvArray}
        sliceType={signal(3)}
        settings={signal({ ...defaultSettings })}
        {...({} as any)}
      />,
    )

    await waitFor(() => expect(calls).toContain('attach:start'))
    // Give the load effect every chance to run ahead of the attach promise.
    await new Promise((r) => setTimeout(r, 50))
    expect(calls).toEqual(['attach:start'])
    expect(nv.addVolume).not.toHaveBeenCalled()

    resolveAttach()
    await waitFor(() => expect(nv.addVolume).toHaveBeenCalled())
    expect(calls).toEqual(['attach:start', 'attach:done', 'addVolume'])
    expect(nv.loadError).toBe('')
  })
})
