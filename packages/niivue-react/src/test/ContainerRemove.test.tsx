import { signal } from '@preact/signals'
import { cleanup, fireEvent, render, screen } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProps, SelectionMode } from '../components/AppProps'
import { Container } from '../components/Container'
import { defaultSettings } from '../settings'

// Closing a tile must release its NiiVue instance (GPU context, animation frame,
// window listeners). Browsers cap the number of live WebGL contexts, so leaked
// instances eventually blank the oldest canvases.

vi.mock('../components/NiiVueCanvas', () => ({ NiiVueCanvas: () => null }))
vi.mock('@niivue/niivue', () => ({
  __esModule: true,
  default: class {},
  SLICE_TYPE: { AXIAL: 0, CORONAL: 1, SAGITTAL: 2, MULTIPLANAR: 3, RENDER: 4 },
  DRAG_MODE: { crosshair: 8 },
}))

function makeNv(key: number) {
  return {
    key,
    volumes: [],
    meshes: [],
    loadError: '',
    isLoaded: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    broadcastTo: vi.fn(),
    destroy: vi.fn(),
  }
}

function makeProps(nvs: ReturnType<typeof makeNv>[]) {
  return {
    nvArray: signal(nvs),
    selection: signal<number[]>([]),
    selectionMode: signal(SelectionMode.NONE),
    hideUI: signal(3),
    sliceType: signal(3),
    location: signal(''),
    settings: signal(defaultSettings),
    syncedIndices: signal(new Set<number>()),
  } as unknown as AppProps
}

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('Container', () => {
  it('destroys the NiiVue instance of a closed tile and keeps the others', () => {
    const [first, second] = [makeNv(1), makeNv(2)]
    const props = makeProps([first, second])
    render(<Container {...props} />)

    fireEvent.click(screen.getAllByRole('button', { name: 'Close' })[0])

    expect(props.nvArray.value).toEqual([second])
    expect(first.destroy).toHaveBeenCalledTimes(1)
    expect(second.destroy).not.toHaveBeenCalled()
  })

  it('keeps the instances when the viewer unmounts with its tiles', () => {
    const nv = makeNv(1)
    const { unmount } = render(<Container {...makeProps([nv])} />)

    unmount()

    expect(nv.destroy).not.toHaveBeenCalled()
  })
})
