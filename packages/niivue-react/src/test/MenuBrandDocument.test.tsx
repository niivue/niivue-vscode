import { SLICE_TYPE } from '@niivue/niivue'
import { signal } from '@preact/signals'
import { cleanup, fireEvent, render, screen } from '@testing-library/preact'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { AppProps, SelectionMode } from '../components/AppProps'
import { Menu } from '../components/Menu'
import { activeMenu } from '../components/MenuElements'

// jsdom has no WebGL and no <dialog> modal support; stub what the menu touches.
vi.mock('@niivue/niivue', () => ({
  SLICE_TYPE: { AXIAL: 0, CORONAL: 1, SAGITTAL: 2, MULTIPLANAR: 3, RENDER: 4 },
  Niivue: vi.fn(),
  NVImage: { loadFromUrl: vi.fn() },
  NVMesh: { readMesh: vi.fn() },
  NVMeshLoaders: { readLayer: vi.fn() },
}))

// Stub only the download helper so "Save" can be asserted without a real Blob/anchor.
const downloadNvd = vi.fn()
vi.mock('../document', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../document')>()),
  downloadNvd: (...args: unknown[]) => downloadNvd(...args),
}))

// Capture the dedicated Load action wired to the NVDocument "Load" entry.
const loadDocumentEvent = vi.fn()
vi.mock('../events', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../events')>()),
  loadDocumentEvent: () => loadDocumentEvent(),
}))

beforeAll(() => {
  // jsdom doesn't implement these; the dialog just needs to not throw.
  HTMLDialogElement.prototype.showModal = vi.fn()
  HTMLDialogElement.prototype.close = vi.fn()
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  // activeMenu is a module-global signal; reset it so an open dropdown in one
  // test doesn't start the next one already open.
  activeMenu.value = null
})

function makeNv() {
  return {
    volumes: [
      {
        name: 'brain.nii.gz',
        getImageMetadata: () => ({ nx: 64, ny: 64, nz: 40, dx: 1, dy: 1, dz: 1, nt: 1 }),
      },
    ],
    meshes: [],
    scene: { pan2Dxyzmm: [0, 0, 0, 1] },
    opts: {},
    json: () => ({ scene: 'data' }),
    drawScene: vi.fn(),
    updateGLVolume: vi.fn(),
    getRadiologicalConvention: vi.fn(() => false),
    setInterpolation: vi.fn(),
    setRadiologicalConvention: vi.fn(),
    setCrosshairWidth: vi.fn(),
    dragModes: { slicer3D: 1, contrast: 2 },
  }
}

function makeProps(menuItems: Record<string, boolean>) {
  return {
    nvArray: signal([makeNv()]),
    selection: signal([0]),
    selectionMode: signal(SelectionMode.SINGLE),
    sliceType: signal(SLICE_TYPE.MULTIPLANAR),
    hideUI: signal(3),
    settings: signal({
      interpolation: true,
      showCrosshairs: true,
      radiologicalConvention: false,
      colorbar: false,
      zoomDragMode: false,
      menuItems,
    }),
  } as unknown as AppProps
}

describe('NVDocument menu', () => {
  it('clicking the NVDocument label saves by default', () => {
    render(<Menu {...makeProps({ saveScene: true })} />)

    fireEvent.click(screen.getByRole('button', { name: 'NVDocument' }))

    expect(downloadNvd).toHaveBeenCalledTimes(1)
    // The exported filename derives from the active volume and ends in .nvd.
    expect(downloadNvd.mock.calls[0][1]).toBe('brain.nvd')
  })

  it('the chevron opens Save and Load entries', async () => {
    render(<Menu {...makeProps({ saveScene: true })} />)

    fireEvent.click(screen.getByTestId('menu-item-dropdown-NVDocument'))

    fireEvent.click(await screen.findByText('Load'))
    expect(loadDocumentEvent).toHaveBeenCalledTimes(1)
    expect(downloadNvd).not.toHaveBeenCalled()
  })

  it('there is no legacy "Save Scene" button', () => {
    render(<Menu {...makeProps({ saveScene: true })} />)
    expect(screen.queryByRole('button', { name: 'Save Scene' })).toBeNull()
  })
})

describe('Brand menu', () => {
  it('replaces the Home button: no Home entry remains', () => {
    render(<Menu {...makeProps({ home: true })} />)
    expect(screen.queryByRole('button', { name: 'Home' })).toBeNull()
  })

  it('clicking the brand reveals Reset Viewer and About', async () => {
    render(<Menu {...makeProps({ home: true })} />)

    fireEvent.click(screen.getByTestId('menu-brand'))

    expect(await screen.findByText('Reset Viewer')).toBeTruthy()
    expect(await screen.findByText('About')).toBeTruthy()
  })

  it('About opens the about dialog', async () => {
    render(<Menu {...makeProps({ home: true })} />)

    fireEvent.click(screen.getByTestId('menu-brand'))
    fireEvent.click(await screen.findByText('About'))

    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled()
  })

  it('stays a static brand (no trigger) when the home flag is off', () => {
    render(<Menu {...makeProps({ home: false })} />)
    expect(screen.queryByTestId('menu-brand')).toBeNull()
  })
})
