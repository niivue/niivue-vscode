import { SLICE_TYPE } from '@niivue/niivue'
import { signal } from '@preact/signals'
import { cleanup, fireEvent, render, screen } from '@testing-library/preact'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppProps, SelectionMode } from '../components/AppProps'
import { Menu } from '../components/Menu'

// Mock canvas and niivue to avoid webgl context issues in jsdom.
// v1 surface: the package's default export is the NiiVueGPU class (events.ts does
// `import NiiVue from '@niivue/niivue'` and `extends NiiVue`), plus the DRAG_MODE
// and SLICE_TYPE value enums. NVImage/NVMesh are types-only now, so they are not
// re-exported. The instance methods the tests exercise live on the mock objects
// passed in via nvArray below. The class is declared inside the factory because
// vi.mock is hoisted above module top-level bindings.
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

describe('Menu', () => {
  it('cycles clip plane correctly', async () => {
    let currentClipPlane = [0, 0, 0, 0]
    
    const mockNiivue = {
      volumes: [],
      meshes: [],
      currentClipPlaneIndex: 0,
      scene: {
        clipPlaneDepthAziElev: [2, 0, 0]
      },
      opts: {
      },
      setClipPlane: vi.fn((newPlane) => {
        currentClipPlane = newPlane
        mockNiivue.scene.clipPlaneDepthAziElev = newPlane
      }),
      drawScene: vi.fn(),
      getRadiologicalConvention: vi.fn(() => false),
      setInterpolation: vi.fn(),
      setRadiologicalConvention: vi.fn(),
      setCrosshairWidth: vi.fn(),
      dragModes: { slicer3D: 1, contrast: 2 }
    }
    
    const mockProps = {
      nvArray: signal([mockNiivue]),
      selection: signal([0]),
      selectionMode: signal(SelectionMode.SINGLE),
      sliceType: signal(SLICE_TYPE.RENDER),
      hideUI: signal(3),
      settings: signal({
        interpolation: true,
        showCrosshairs: true,
        radiologicalConvention: false,
        colorbar: false,
        zoomDragMode: false,
        menuItems: { view: true, navigation: true }
      })
    }
    
    render(<Menu {...mockProps as unknown as AppProps} />)
    
    // Click the dropdown arrow button to open the View menu
    // (the label button calls resetZoom and closes any open dropdown)
    const viewDropdown = screen.getByTestId('menu-item-dropdown-View')
    fireEvent.click(viewDropdown)
    
    // Find Cycle Clip Plane (3D)
    const cycleClipButton = await screen.findByText("Cycle Clip Plane (3D)")
    
    // Test initial -> index 1 -> [0, 270, 0]
    fireEvent.click(cycleClipButton)
    expect(mockNiivue.setClipPlane).toHaveBeenCalledWith([0, 270, 0])
  })
})

// Keyboard -> Menu WIRING. useKeyboardShortcuts.test.tsx proves each key calls
// the right handler; this proves <Menu>'s handlers map those keys to the correct
// concrete sliceType / hideUI VALUES (incl. the cycle math) - the value mapping
// the old keyboard e2e asserted, now covered here with no WebGL load.
afterEach(() => cleanup())

function makeKbNv() {
  return {
    volumes: [],
    meshes: [],
    graph: { autoSizeMultiplanar: true },
    scene: { pan2Dxyzmm: [1, 1, 1, 1] },
    opts: {},
    updateGLVolume: vi.fn(),
    drawScene: vi.fn(),
    getRadiologicalConvention: vi.fn(() => false),
    setInterpolation: vi.fn(),
    setRadiologicalConvention: vi.fn(),
    setCrosshairWidth: vi.fn(),
    dragModes: { slicer3D: 1, contrast: 2 },
  }
}

function makeKbProps(over: Record<string, unknown> = {}) {
  return {
    nvArray: signal([makeKbNv()]),
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
      menuItems: { view: true, navigation: true },
    }),
    ...over,
  }
}

function pressKey(key: string) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
}

describe('Menu keyboard wiring (key -> view / UI value)', () => {
  it('number keys select the matching slice type', () => {
    const props = makeKbProps()
    render(<Menu {...(props as unknown as AppProps)} />)

    pressKey('1')
    expect(props.sliceType.value).toBe(SLICE_TYPE.AXIAL)
    pressKey('3')
    expect(props.sliceType.value).toBe(SLICE_TYPE.CORONAL)
    pressKey('4')
    expect(props.sliceType.value).toBe(SLICE_TYPE.RENDER)
    pressKey('5')
    expect(props.sliceType.value).toBe(SLICE_TYPE.MULTIPLANAR)
  })

  it('"v" cycles the view mode and wraps modulo 5 (RENDER -> AXIAL)', () => {
    const props = makeKbProps({ sliceType: signal(SLICE_TYPE.RENDER) })
    render(<Menu {...(props as unknown as AppProps)} />)

    pressKey('v')
    expect(props.sliceType.value).toBe(SLICE_TYPE.AXIAL) // (4 + 1) % 5
  })

  it('"u" cycles UI visibility 3 -> 2 -> 0 -> 3', () => {
    const props = makeKbProps({ hideUI: signal(3) })
    render(<Menu {...(props as unknown as AppProps)} />)

    pressKey('u')
    expect(props.hideUI.value).toBe(2)
    pressKey('u')
    expect(props.hideUI.value).toBe(0)
    pressKey('u')
    expect(props.hideUI.value).toBe(3)
  })
})
