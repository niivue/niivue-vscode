import { signal } from '@preact/signals'
import { cleanup, render, waitFor } from '@testing-library/preact'
import { afterEach, describe, expect, it, vi } from 'vitest'

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
    addMesh = vi.fn(async () => {
      this.meshes.push({})
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

import { NiiVueCanvas } from '../components/NiiVueCanvas'
import { ExtendedNiivue } from '../events'
import { defaultSettings } from '../settings'

function mountMesh(view: number, { withVolume = false } = {}) {
  const nv = new ExtendedNiivue({}) as any
  nv.onVolumeUpdated = vi.fn()
  nv.body = { uri: 'lh.pial', data: new ArrayBuffer(8) }
  if (withVolume) {
    nv.volumes.push({})
  }
  const sliceType = signal(view)
  const nvArray = signal<any[]>([nv])
  // Like Container: re-renders the tile when nvArray or the view changes.
  const Tile = () => {
    void nvArray.value
    void sliceType.value
    return (
      <NiiVueCanvas
        nv={nv}
        width={100}
        height={100}
        render={signal(0)}
        nvArray={nvArray}
        sliceType={sliceType}
        settings={signal({ ...defaultSettings })}
        {...({} as any)}
      />
    )
  }
  render(<Tile />)
  return { nv, sliceType }
}

describe('view mode of a mesh', () => {
  afterEach(() => {
    cleanup()
  })

  it('shows Multiplanar + Render as the render for meshes alone, without changing the shared view', async () => {
    const { nv, sliceType } = mountMesh(3)

    await waitFor(() => expect(nv.sliceType).toBe(4))
    expect(sliceType.value).toBe(3)
  })

  it('applies other views to a tile of meshes', async () => {
    const { nv, sliceType } = mountMesh(3)
    await waitFor(() => expect(nv.sliceType).toBe(4))

    sliceType.value = 0
    await waitFor(() => expect(nv.sliceType).toBe(0))
    sliceType.value = 2
    await waitFor(() => expect(nv.sliceType).toBe(2))
  })

  it('keeps Multiplanar + Render for a tile that also holds a volume', async () => {
    const { nv } = mountMesh(3, { withVolume: true })

    await waitFor(() => expect(nv.isLoaded).toBe(true))
    await waitFor(() => expect(nv.sliceType).toBe(3))
  })
})
