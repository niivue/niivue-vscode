import { SLICE_TYPE } from '@niivue/niivue'
import { signal } from '@preact/signals'
import { fireEvent, render, screen } from '@testing-library/preact'
import { describe, expect, it, vi } from 'vitest'
import { AppProps, SelectionMode } from '../components/AppProps'
import { Menu } from '../components/Menu'

// Mock canvas and niivue to avoid webgl context issues in jsdom
vi.mock('@niivue/niivue', () => ({
  SLICE_TYPE: { AXIAL: 0, CORONAL: 1, SAGITTAL: 2, MULTIPLANAR: 3, RENDER: 4 },
  Niivue: vi.fn(),
  NVImage: { loadFromUrl: vi.fn() },
  NVMesh: { readMesh: vi.fn() },
  NVMeshLoaders: { readLayer: vi.fn() },
}))

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
