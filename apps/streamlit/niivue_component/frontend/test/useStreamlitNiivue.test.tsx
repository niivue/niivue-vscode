import { signal } from '@preact/signals'
import { act, cleanup, render } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useStreamlitNiivue } from '../src/hooks/useStreamlitNiivue'
import { StreamlitArgs } from '../src/types'

// A fake viewer that loads like @niivue/react: addImage hands the image to the
// first instance without one, NiiVueCanvas later marks it loaded and reassigns
// nvArray, and overlay messages resolve once their load is done.

type FakeNv = {
  isNew: boolean
  isLoaded: boolean
  volumes: unknown[]
  meshes: unknown[]
  updateGLVolume: () => void
}

interface FakeAppProps {
  nvArray: { value: FakeNv[] }
  sliceType: { value: number }
  settings: { value: object }
}

const mocks = vi.hoisted(() => ({
  setComponentValue: vi.fn(),
  overlayLoads: [] as Array<() => void>,
  appProps: null as unknown as FakeAppProps,
}))

vi.mock('streamlit-component-lib', () => ({
  Streamlit: { setComponentValue: mocks.setComponentValue, setFrameHeight: vi.fn() },
}))

vi.mock('@niivue/react', () => ({
  useAppState: () => mocks.appProps,
  isImageType: () => true,
  initCanvas: (appProps: FakeAppProps, n: number) => {
    for (let i = 0; i < n; i++) {
      const nv: FakeNv = {
        isNew: true,
        isLoaded: false,
        volumes: [{}],
        meshes: [],
        updateGLVolume: () => {},
      }
      appProps.nvArray.value = [...appProps.nvArray.value, nv]
    }
  },
  handleMessage: (message: { type: string }, appProps: FakeAppProps) => {
    if (message.type === 'addImage') {
      appProps.nvArray.value.find((nv) => nv.isNew)!.isNew = false
      appProps.nvArray.value = [...appProps.nvArray.value]
      return Promise.resolve(true)
    }
    return new Promise((resolve) => {
      mocks.overlayLoads.push(() => {
        appProps.nvArray.value = [...appProps.nvArray.value]
        resolve(true)
      })
    })
  },
}))

function Probe({ args }: { args: StreamlitArgs }) {
  useStreamlitNiivue(args)
  return null
}

const loadEvents = () =>
  mocks.setComponentValue.mock.calls.map(([value]) => value).filter((v) => v.type !== 'voxel_click')

async function finishBaseLoad() {
  await act(() => {
    const nv = mocks.appProps.nvArray.value[0]
    nv.isLoaded = true
    mocks.appProps.nvArray.value = [...mocks.appProps.nvArray.value]
  })
}

const base64 = btoa('image bytes')
const overlays = [
  { data: btoa('overlay one'), name: 'one.nii.gz' },
  { data: btoa('overlay two'), name: 'two.nii.gz' },
]

beforeEach(() => {
  mocks.setComponentValue.mockReset()
  mocks.overlayLoads = []
  mocks.appProps = {
    nvArray: signal<FakeNv[]>([]),
    sliceType: signal(0),
    settings: signal({}),
  }
})

afterEach(() => cleanup())

describe('useStreamlitNiivue load events', () => {
  it('reports base_loaded, then fully_loaded once the overlays have loaded', async () => {
    const args: StreamlitArgs = {
      nifti_data: base64,
      filename: 'sub-01_T1w.nii.gz',
      overlays,
      load_events: true,
      update_interval_ms: null,
    }
    const { rerender } = render(<Probe args={args} />)
    expect(loadEvents()).toEqual([])

    await finishBaseLoad()
    expect(loadEvents().map((e) => e.type)).toEqual(['base_loaded'])
    expect(mocks.overlayLoads).toHaveLength(2)

    await act(() => mocks.overlayLoads[0]())
    expect(loadEvents().map((e) => e.type)).toEqual(['base_loaded'])

    await act(() => mocks.overlayLoads[1]())
    expect(loadEvents()).toEqual([
      { type: 'base_loaded', filename: 'sub-01_T1w.nii.gz', timestamp: expect.any(Number) },
      { type: 'fully_loaded', filename: 'sub-01_T1w.nii.gz', timestamp: expect.any(Number) },
    ])

    // Each event re-runs the Streamlit script, which renders the component
    // again with equal arguments in new objects. That must not report again.
    await act(() => rerender(<Probe args={{ ...args, overlays: [...overlays] }} />))
    expect(loadEvents()).toHaveLength(2)
  })

  it('reports both events once the image is shown when nothing else is requested', async () => {
    render(<Probe args={{ nifti_data: base64, filename: 'brain.nii', load_events: true }} />)

    await finishBaseLoad()

    expect(loadEvents().map((e) => e.type)).toEqual(['base_loaded', 'fully_loaded'])
  })

  it('reports nothing unless load_events is set', async () => {
    render(<Probe args={{ nifti_data: base64, filename: 'brain.nii', overlays }} />)

    await finishBaseLoad()
    await act(() => mocks.overlayLoads.forEach((finish) => finish()))

    expect(loadEvents()).toEqual([])
  })
})
