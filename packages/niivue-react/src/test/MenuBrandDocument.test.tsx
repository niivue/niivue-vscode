import { SLICE_TYPE } from '@niivue/niivue'
import { signal } from '@preact/signals'
import { cleanup, fireEvent, render, screen } from '@testing-library/preact'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { AppProps, SelectionMode } from '../components/AppProps'
import { Menu } from '../components/Menu'
import { activeMenu } from '../components/MenuElements'

// jsdom has no WebGL and no <dialog> modal support; stub what the menu touches.
// v1: the package default export is the NiiVueGPU class (events.ts does
// `import NiiVue from '@niivue/niivue'` and `extends NiiVue`), plus the DRAG_MODE /
// SLICE_TYPE value enums. NVImage/NVMesh/NVMeshLoaders are gone; the instance
// surface the menu touches lives on makeNv below.
vi.mock('@niivue/niivue', () => {
  class NiiVueGPU {
    constructor(_opts?: unknown) {}
    attachToCanvas = vi.fn()
    addEventListener = vi.fn()
    addVolume = vi.fn()
    addMesh = vi.fn()
    addMeshLayer = vi.fn()
    setVolume = vi.fn()
    setMeshLayerProperty = vi.fn()
    updateGLVolume = vi.fn()
    setFrame4D = vi.fn()
  }
  return {
    __esModule: true,
    default: NiiVueGPU,
    SLICE_TYPE: { AXIAL: 0, CORONAL: 1, SAGITTAL: 2, MULTIPLANAR: 3, RENDER: 4 },
    DRAG_MODE: { none: 0, contrast: 1, measurement: 2, pan: 3, slicer3D: 4, callbackOnly: 5, roiSelection: 6, angle: 7, crosshair: 8, windowing: 9 },
  }
})

// Stub the download helpers so "Save" / "Save as JSON" can be asserted without a
// real Blob/anchor.
const downloadNvd = vi.fn()
const downloadSceneJson = vi.fn()
vi.mock('../document', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../document')>()),
  downloadNvd: (...args: unknown[]) => downloadNvd(...args),
  downloadSceneJson: (...args: unknown[]) => downloadSceneJson(...args),
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
        // v1: metadata is read from the NIfTI header (the getImageMetadata helper),
        // not a method. dims = [ndim, nx, ny, nz, nt]; pixDims = [qfac, dx, dy, dz].
        hdr: { dims: [3, 64, 64, 40, 1], pixDims: [1, 1, 1, 1] },
        nFrame4D: 1,
      },
    ],
    meshes: [],
    opts: {},
    // v1: serializeDocument() (CBOR bytes) replaces nv.json(); saveScene hands
    // the bytes to the (mocked) downloadNvd / downloadSceneJson helpers.
    serializeDocument: () => new Uint8Array([1, 2, 3]),
    drawScene: vi.fn(),
    updateGLVolume: vi.fn(),
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

  it('the chevron offers a JSON export that re-opens through parseNvd', async () => {
    render(<Menu {...makeProps({ saveScene: true })} />)

    fireEvent.click(screen.getByTestId('menu-item-dropdown-NVDocument'))

    fireEvent.click(await screen.findByText('Save as JSON'))
    expect(downloadSceneJson).toHaveBeenCalledTimes(1)
    expect(downloadSceneJson.mock.calls[0][1]).toBe('brain.nvd.json')
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
