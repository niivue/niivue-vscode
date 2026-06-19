import { signal } from '@preact/signals'
import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * Characterization tests for the three riskiest @niivue/niivue v1 transforms,
 * driven through the public message bus (handleMessage) with a mocked niivue
 * instance. These lock the new call shapes so a regression in the loader/overlay
 * rewrites is caught without a WebGL context:
 *   (a) addMeshOverlay -> nv.addMeshLayer(0, { colormap, opacity, calMin, calMax })
 *   (b) the overlay loader wraps in-memory buffers in a File and calls
 *       nv.addVolume / nv.addMesh with url instanceof File
 *   (c) ExtendedNiivue passes the renamed constructor options
 *       (primaryDragMode / isDragDropEnabled) and no longer defines
 *       mouseMoveListener.
 */

// Capture the options the ExtendedNiivue base constructor receives.
const ctorOpts: Array<Record<string, unknown>> = []

vi.mock('@niivue/niivue', () => {
  class NiiVueGPU {
    constructor(opts?: Record<string, unknown>) {
      ctorOpts.push(opts ?? {})
    }
    // methods the migrated code calls on a real instance
    attachToCanvas = vi.fn().mockResolvedValue(undefined)
    addEventListener = vi.fn()
    addVolume = vi.fn().mockResolvedValue(undefined)
    addMesh = vi.fn().mockResolvedValue(undefined)
    addMeshLayer = vi.fn().mockResolvedValue(undefined)
    setVolume = vi.fn().mockResolvedValue(undefined)
    setMeshLayerProperty = vi.fn().mockResolvedValue(undefined)
    updateGLVolume = vi.fn().mockResolvedValue(undefined)
    // a real-ish mutable surface the overlay/curvature path reads
    meshes: Array<{ layers: unknown[] }> = []
    volumes: unknown[] = []
    isColorbarVisible = false
  }
  return {
    __esModule: true,
    default: NiiVueGPU,
    SLICE_TYPE: { AXIAL: 0, CORONAL: 1, SAGITTAL: 2, MULTIPLANAR: 3, RENDER: 4 },
    DRAG_MODE: { none: 0, contrast: 1, measurement: 2, pan: 3, slicer3D: 4, callbackOnly: 5, roiSelection: 6, angle: 7, crosshair: 8, windowing: 9 },
  }
})

// Import AFTER the mock is registered.
import { ExtendedNiivue, handleMessage } from '../events'
import { defaultSettings } from '../settings'

function makeAppProps(nv: any) {
  return {
    nvArray: signal([nv]),
    selection: signal<number[]>([0]),
    selectionMode: signal(0),
    hideUI: signal(3),
    sliceType: signal(3),
    location: signal(''),
    settings: signal({ ...defaultSettings }),
    syncedIndices: signal(new Set<number>()),
  } as any
}

// A mock nv instance with one loaded mesh, matching the overlay code's
// expectations (nv.meshes[0].layers, addMeshLayer, updateGLVolume, ...).
function makeMeshNv() {
  return {
    isNew: false,
    meshes: [{ layers: [] as unknown[] }],
    volumes: [] as unknown[],
    isColorbarVisible: false,
    addMeshLayer: vi.fn().mockResolvedValue(undefined),
    setMeshLayerProperty: vi.fn().mockResolvedValue(undefined),
    updateGLVolume: vi.fn().mockResolvedValue(undefined),
    addVolume: vi.fn().mockResolvedValue(undefined),
    addMesh: vi.fn().mockResolvedValue(undefined),
  }
}

afterEach(() => {
  ctorOpts.length = 0
  vi.clearAllMocks()
})

describe('(a) addMeshOverlay -> nv.addMeshLayer(0, opts)', () => {
  it('loads a mesh overlay as layer on mesh index 0 with the expected options', async () => {
    const nv = makeMeshNv()
    const data = new Uint8Array([1, 2, 3, 4]).buffer
    await handleMessage(
      { type: 'addMeshOverlay', body: { index: 0, uri: 'overlay.gii', data } },
      makeAppProps(nv),
    )

    expect(nv.addMeshLayer).toHaveBeenCalledTimes(1)
    const [meshIndex, opts] = nv.addMeshLayer.mock.calls[0]
    expect(meshIndex).toBe(0)
    expect(opts.url).toBeInstanceOf(File)
    expect(opts.name).toBe('overlay.gii')
    expect(opts.opacity).toBe(0.7)
    expect(opts.colormap).toBe(defaultSettings.defaultMeshOverlayColormap || 'hsv')
    expect(nv.isColorbarVisible).toBe(true)
  })

  it('curvature overlay hides its own colorbar via setMeshLayerProperty(0, n, { isColorbarVisible: false })', async () => {
    const nv = makeMeshNv()
    // simulate addMeshLayer appending a layer so layerNumber resolves to 0
    nv.addMeshLayer.mockImplementation(async () => {
      nv.meshes[0].layers.push({})
    })
    const data = new Uint8Array([9, 9]).buffer
    await handleMessage(
      { type: 'addMeshCurvature', body: { index: 0, uri: 'lh.curv', data } },
      makeAppProps(nv),
    )

    expect(nv.addMeshLayer).toHaveBeenCalledTimes(1)
    const curvOpts = nv.addMeshLayer.mock.calls[0][1]
    expect(curvOpts.colormap).toBe('gray')
    expect(curvOpts.calMin).toBe(0.3)
    expect(curvOpts.calMax).toBe(0.5)
    expect(nv.setMeshLayerProperty).toHaveBeenCalledWith(0, 0, { isColorbarVisible: false })
  })
})

describe('(b) overlay loader wraps in-memory buffers in a File', () => {
  it('image overlay -> nv.addVolume({ url: File, ... })', async () => {
    const nv = makeMeshNv()
    const data = new Uint8Array([0, 1, 2, 3]).buffer
    await handleMessage(
      { type: 'overlay', body: { index: 0, uri: 'overlay.nii.gz', data } },
      makeAppProps(nv),
    )

    expect(nv.addVolume).toHaveBeenCalledTimes(1)
    const arg = nv.addVolume.mock.calls[0][0]
    expect(arg.url).toBeInstanceOf(File)
    expect(arg.name).toBe('overlay.nii.gz')
  })

  it('image overlay with empty data loads from the URL (regression: url is the uri, not "")', async () => {
    // A URL-load overlay carries data: '' (empty string). url must fall back to
    // item.uri; an empty string would make niivue throw "prepareVolume requires
    // a url or an NVImage object".
    const nv = makeMeshNv()
    await handleMessage(
      { type: 'overlay', body: { index: 0, uri: 'https://example.test/ov.nii.gz', data: '' } },
      makeAppProps(nv),
    )
    expect(nv.addVolume).toHaveBeenCalledTimes(1)
    expect(nv.addVolume.mock.calls[0][0].url).toBe('https://example.test/ov.nii.gz')
  })

  it('mesh overlay (non-image uri) -> nv.addMesh({ url: File, ... })', async () => {
    const nv = makeMeshNv()
    const data = new Uint8Array([5, 6, 7]).buffer
    await handleMessage(
      { type: 'overlay', body: { index: 0, uri: 'brain.obj', data } },
      makeAppProps(nv),
    )

    expect(nv.addMesh).toHaveBeenCalledTimes(1)
    const arg = nv.addMesh.mock.calls[0][0]
    expect(arg.url).toBeInstanceOf(File)
    expect(arg.name).toBe('brain.obj')
  })
})

describe('(c) ExtendedNiivue v1 constructor options + no mouseMoveListener', () => {
  it('passes primaryDragMode / isDragDropEnabled and omits the removed hotkey/resize options', async () => {
    // initCanvas -> growNvArrayBy -> new ExtendedNiivue({...})
    const props = makeAppProps(makeMeshNv())
    // start from an empty array so initCanvas actually constructs instances
    props.nvArray.value = []
    await handleMessage({ type: 'initCanvas', body: { n: 1 } }, props)

    expect(ctorOpts.length).toBeGreaterThanOrEqual(1)
    const opts = ctorOpts[ctorOpts.length - 1]
    expect(opts.primaryDragMode).toBe(8) // DRAG_MODE.crosshair
    expect(opts.isDragDropEnabled).toBe(false)
    // removed options must not be passed
    expect('dragMode' in opts).toBe(false)
    expect('dragAndDropEnabled' in opts).toBe(false)
    expect('isResizeCanvas' in opts).toBe(false)
    expect('clipPlaneHotKey' in opts).toBe(false)
    expect('viewModeHotKey' in opts).toBe(false)
  })

  it('no longer defines a mouseMoveListener override', () => {
    expect((ExtendedNiivue.prototype as any).mouseMoveListener).toBeUndefined()
    const inst = new ExtendedNiivue({})
    expect((inst as any).mouseMoveListener).toBeUndefined()
  })
})
