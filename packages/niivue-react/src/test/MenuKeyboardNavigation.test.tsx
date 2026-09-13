import { signal } from '@preact/signals'
import { cleanup, render } from '@testing-library/preact'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppProps, SelectionMode } from '../components/AppProps'
import { Menu } from '../components/Menu'

// jsdom has no WebGL; stub the niivue module surface the menu imports.
vi.mock('@niivue/niivue', () => {
  class NiiVueGPU {}
  return {
    __esModule: true,
    default: NiiVueGPU,
    SLICE_TYPE: { AXIAL: 0, CORONAL: 1, SAGITTAL: 2, MULTIPLANAR: 3, RENDER: 4 },
    DRAG_MODE: { none: 0, contrast: 1, measurement: 2, pan: 3, slicer3D: 4, callbackOnly: 5, roiSelection: 6, angle: 7, crosshair: 8, windowing: 9 },
  }
})

afterEach(() => cleanup())

function makeNv(sliceType: number) {
  return {
    volumes: [{ name: 'brain.nii.gz', hdr: { dims: [3, 64, 64, 40, 1], pixDims: [1, 1, 1, 1] }, nFrame4D: 1 }],
    meshes: [],
    opts: {},
    sliceType,
    azimuth: 359,
    elevation: 90,
    moveCrosshairInVox: vi.fn(),
    drawScene: vi.fn(),
  }
}

function renderMenu(nv: ReturnType<typeof makeNv>) {
  const props = {
    nvArray: signal([nv]),
    selection: signal([0]),
    selectionMode: signal(SelectionMode.SINGLE),
    sliceType: signal(nv.sliceType),
    hideUI: signal(3),
    settings: signal({ menuItems: {} }),
  } as unknown as AppProps
  render(<Menu {...props} />)
}

const press = (key: string, init: KeyboardEventInit = {}) =>
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...init }))

describe('H/J/K/L and Ctrl+U/D keys', () => {
  it('step the crosshair one voxel in slice views', () => {
    const nv = makeNv(0)
    renderMenu(nv)

    press('l')
    press('h')
    press('k')
    press('j')
    press('u', { ctrlKey: true })
    press('d', { ctrlKey: true })

    expect(nv.moveCrosshairInVox.mock.calls).toEqual([
      [1, 0, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [0, -1, 0],
      [0, 0, 1],
      [0, 0, -1],
    ])
  })

  it('turn the camera in the render view, wrapping azimuth and clamping elevation', () => {
    const nv = makeNv(4)
    renderMenu(nv)

    press('l')
    expect(nv.azimuth).toBe(0)
    press('j')
    expect(nv.elevation).toBe(90)
    press('k')
    expect(nv.elevation).toBe(89)
    expect(nv.moveCrosshairInVox).not.toHaveBeenCalled()
  })
})
