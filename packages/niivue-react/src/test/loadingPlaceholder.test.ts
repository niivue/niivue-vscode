import { signal } from '@preact/signals'
import { describe, expect, it, vi } from 'vitest'
import type { AppProps } from '../components/AppProps'

vi.mock('@niivue/niivue', () => {
  class NiiVueGPU {
    opts: Record<string, unknown>
    constructor(opts: Record<string, unknown> = {}) {
      this.opts = opts
    }
  }
  return {
    __esModule: true,
    default: NiiVueGPU,
    SLICE_TYPE: { AXIAL: 0, CORONAL: 1, SAGITTAL: 2, MULTIPLANAR: 3, RENDER: 4 },
    DRAG_MODE: { crosshair: 8 },
  }
})

import { initCanvas } from '../events'

describe('a new tile', () => {
  it('says it is loading instead of NiiVue\'s "No image loaded"', () => {
    const props = { nvArray: signal([]), sliceType: signal(3), settings: signal({}) } as unknown as AppProps

    initCanvas(props, 2)

    for (const nv of props.nvArray.value as unknown as { opts: { placeholderText?: string } }[]) {
      expect(nv.opts.placeholderText).toBe('Loading…')
    }
    expect(props.nvArray.value).toHaveLength(2)
  })
})
