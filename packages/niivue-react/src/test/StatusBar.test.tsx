import { signal } from '@preact/signals'
import { cleanup, render } from '@testing-library/preact'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppProps, SelectionMode } from '../components/AppProps'
import { StatusBar } from '../components/StatusBar'

vi.mock('@niivue/niivue', () => ({
  SLICE_TYPE: { AXIAL: 0, CORONAL: 1, SAGITTAL: 2, MULTIPLANAR: 3, RENDER: 4 },
  Niivue: vi.fn(),
}))

afterEach(cleanup)

function makeProps(over: Record<string, unknown> = {}): AppProps {
  return {
    nvArray: signal([]),
    selection: signal([]),
    selectionMode: signal(SelectionMode.NONE),
    hideUI: signal(3),
    sliceType: signal(3),
    location: signal(''),
    settings: signal({}),
    syncedIndices: signal(new Set()),
    ...over,
  } as unknown as AppProps
}

describe('StatusBar', () => {
  it('renders the global mm location and updates reactively', async () => {
    const props = makeProps()
    const { container } = render(<StatusBar {...props} />)
    const loc = () => container.querySelector('.nv-status-loc')?.textContent
    expect(loc()).toBe('')

    props.location.value = '0.20 x 16.74 x 7.15 x 1.00 mm'
    await Promise.resolve()
    expect(loc()).toBe('0.20 x 16.74 x 7.15 x 1.00 mm')
  })

  it('shows the matrix-size metadata for a loaded volume', () => {
    const nv = {
      volumes: [{ getImageMetadata: () => ({ nx: 207, ny: 256, nz: 215, dx: 0.74, dy: 0.74, dz: 0.74, nt: 1 }) }],
      meshes: [],
    }
    const props = makeProps({ nvArray: signal([nv]) })
    const { container } = render(<StatusBar {...props} />)
    expect(container.querySelector('.nv-status-meta')?.textContent).toContain('matrix size: 207 x 256 x 215')
  })
})
