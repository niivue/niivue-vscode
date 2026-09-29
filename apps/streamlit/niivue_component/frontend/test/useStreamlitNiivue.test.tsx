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
  loadError: string
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
  overlayLoads: [] as Array<(error?: Error) => void>,
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
        loadError: '',
        volumes: [{}],
        meshes: [],
        updateGLVolume: () => {},
      }
      appProps.nvArray.value = [...appProps.nvArray.value, nv]
    }
  },
  handleMessage: (message: { type: string; body: { uri?: string; loadError?: string } }, appProps: FakeAppProps) => {
    if (message.type === 'addImage') {
      const nv = appProps.nvArray.value.find((nv) => nv.isNew)!
      nv.isNew = false
      nv.loadError = message.body.loadError ?? ''
      appProps.nvArray.value = [...appProps.nvArray.value]
      return Promise.resolve(true)
    }
    // A failed load rejects before nvArray is reassigned, as in @niivue/react.
    return new Promise((resolve, reject) => {
      mocks.overlayLoads.push((error) => {
        if (error) {
          reject(error)
          return
        }
        if (message.type === 'overlay' && message.body.uri?.endsWith('.pial')) {
          appProps.nvArray.value[0].meshes.push({ layers: [] })
        }
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

async function failBaseLoad(message: string) {
  await act(() => {
    mocks.appProps.nvArray.value[0].loadError = message
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

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

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

  it('reports load_error with the message when the image fails to load', async () => {
    render(<Probe args={{ nifti_data: base64, filename: 'broken.nii', load_events: true }} />)

    await failBaseLoad('Unsupported datatype')

    expect(loadEvents()).toEqual([
      { type: 'load_error', filename: 'broken.nii', timestamp: expect.any(Number), error: 'Unsupported datatype' },
    ])
  })

  it('reports load_error for an MHD file without its paired data', async () => {
    render(<Probe args={{ nifti_data: base64, filename: 'scan.mhd', load_events: true }} />)
    await act(() => {})

    expect(loadEvents()).toEqual([
      { type: 'load_error', filename: 'scan.mhd', timestamp: expect.any(Number), error: expect.stringContaining('paired_data') },
    ])
  })

  it('waits for the mesh overlays once the mesh has loaded', async () => {
    const meshes = [
      { data: btoa('mesh'), name: 'lh.pial', overlays: [{ data: btoa('thickness'), name: 'lh.thickness' }] },
    ]
    render(<Probe args={{ nifti_data: base64, filename: 'brain.nii', meshes, load_events: true }} />)
    await finishBaseLoad()

    // In the app the mesh load settles before the effects that start its overlays run.
    await act(async () => {
      mocks.overlayLoads[0]()
      await Promise.resolve()
    })
    expect(loadEvents().map((e) => e.type)).toEqual(['base_loaded'])
    expect(mocks.overlayLoads).toHaveLength(2)

    await act(() => mocks.overlayLoads[1]())
    expect(loadEvents().map((e) => e.type)).toEqual(['base_loaded', 'fully_loaded'])
  })

  it('reports fully_loaded after the mesh overlays in mesh-only mode', async () => {
    const meshes = [
      { data: btoa('mesh'), name: 'lh.pial', overlays: [{ data: btoa('thickness'), name: 'lh.thickness' }] },
    ]
    render(<Probe args={{ meshes, load_events: true }} />)

    await act(() => {
      const nv = mocks.appProps.nvArray.value[0]
      nv.meshes = [{ layers: [] }]
      nv.isLoaded = true
      mocks.appProps.nvArray.value = [...mocks.appProps.nvArray.value]
    })
    expect(loadEvents().map((e) => e.type)).toEqual(['base_loaded'])
    expect(mocks.overlayLoads).toHaveLength(1)

    await act(() => mocks.overlayLoads[0]())
    expect(loadEvents().map((e) => e.type)).toEqual(['base_loaded', 'fully_loaded'])
  })

  it('reports fully_loaded when the only mesh fails, even with mesh overlays requested', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const meshes = [
      { data: btoa('mesh'), name: 'lh.pial', overlays: [{ data: btoa('thickness'), name: 'lh.thickness' }] },
    ]
    render(<Probe args={{ nifti_data: base64, filename: 'brain.nii', meshes, load_events: true }} />)

    await finishBaseLoad()
    expect(mocks.overlayLoads).toHaveLength(1)

    await act(() => mocks.overlayLoads[0](new Error('bad mesh')))
    expect(loadEvents().map((e) => e.type)).toEqual(['base_loaded', 'fully_loaded'])
  })

  it('reports fully_loaded again when the overlays change for the same image', async () => {
    const args: StreamlitArgs = { nifti_data: base64, filename: 'brain.nii', overlays, load_events: true }
    const { rerender } = render(<Probe args={args} />)
    await finishBaseLoad()
    await act(() => mocks.overlayLoads.forEach((finish) => finish()))

    await act(() => rerender(<Probe args={{ ...args, overlays: [overlays[0]] }} />))
    expect(mocks.overlayLoads).toHaveLength(3)
    await act(() => mocks.overlayLoads[2]())

    expect(loadEvents().map((e) => e.type)).toEqual(['base_loaded', 'fully_loaded', 'fully_loaded'])
  })

  it('reports nothing after unmounting, even when a load settles later', async () => {
    const { unmount } = render(<Probe args={{ nifti_data: base64, filename: 'brain.nii', overlays, load_events: true }} />)
    await finishBaseLoad()

    unmount()
    await act(() => mocks.overlayLoads.forEach((finish) => finish()))

    expect(loadEvents().map((e) => e.type)).toEqual(['base_loaded'])
  })
})
