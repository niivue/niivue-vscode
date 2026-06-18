import { signal } from '@preact/signals'
import { fireEvent, render, screen } from '@testing-library/preact'
import { describe, expect, it, vi } from 'vitest'
import { ScalingBox } from '../components/ScalingBox'

// Mock niivue to avoid webgl context issues in jsdom
vi.mock('@niivue/niivue', () => ({
  Niivue: vi.fn(),
}))

function makeVolumeNv(overlay: Record<string, unknown> = {}) {
  return {
    volumes: [
      {
        colormap: 'gray',
        colormapNegative: '',
        colormapInvert: false,
        colormapType: 0,
        opacity: 1,
        cal_min: 0,
        cal_max: 1,
        ...overlay,
      },
    ],
    meshes: [],
    colormaps: () => ['gray', 'warm'],
    updateGLVolume: vi.fn(),
  }
}

function makeMeshNv(layerOverride: Record<string, unknown> = {}) {
  const layer = {
    colormap: 'hsv',
    colormapNegative: '',
    colormapInvert: false,
    colormapType: 0,
    opacity: 1,
    cal_min: 0,
    cal_max: 1,
    ...layerOverride,
  }
  return {
    volumes: [],
    meshes: [{ id: 'mesh-1', layers: [layer] }],
    setMeshLayerProperty: vi.fn((_id: string, _layer: number, key: string, val: unknown) => {
      ;(layer as Record<string, unknown>)[key] = val
    }),
    updateGLVolume: vi.fn(),
  }
}

function renderBox(nv: ReturnType<typeof makeVolumeNv> | ReturnType<typeof makeMeshNv>) {
  return render(
    <ScalingBox
      nvArraySelected={signal([nv])}
      selectedOverlayNumber={signal(0)}
      overlayMenu={signal(true)}
      visible={signal(true)}
    />,
  )
}

describe('ScalingBox "Hide 0" toggle (#237)', () => {
  it('switches colormapType to ZERO_TO_MAX_TRANSPARENT_BELOW_MIN and back', () => {
    const nv = makeVolumeNv()
    renderBox(nv)

    const button = screen.getByText('Hide 0')

    fireEvent.click(button)
    expect(nv.volumes[0].colormapType).toBe(1)
    expect(nv.updateGLVolume).toHaveBeenCalledTimes(1)

    fireEvent.click(button)
    expect(nv.volumes[0].colormapType).toBe(0)
    expect(nv.updateGLVolume).toHaveBeenCalledTimes(2)
  })

  it('reflects an overlay that already renders zero as transparent', () => {
    const nv = makeVolumeNv({ colormapType: 1 })
    renderBox(nv)

    // Active state uses the white background highlight, matching the Invert button.
    const button = screen.getByText('Hide 0')
    expect(button.className).toContain('bg-white')
  })

  it('routes mesh-layer overlays through setMeshLayerProperty', () => {
    const nv = makeMeshNv()
    renderBox(nv)

    const button = screen.getByText('Hide 0')

    fireEvent.click(button)
    expect(nv.setMeshLayerProperty).toHaveBeenCalledWith('mesh-1', 0, 'colormapType', 1)

    fireEvent.click(button)
    expect(nv.setMeshLayerProperty).toHaveBeenCalledWith('mesh-1', 0, 'colormapType', 0)
  })

  // colormapType=1 re-anchors the colormap at zero, so without a negative
  // colormap the whole negative half of signed data would vanish. The toggle
  // adds one for signed overlays and removes it again on toggle-off.
  it('adds a negative colormap for signed data and removes it on toggle-off', () => {
    const nv = makeVolumeNv({ cal_min: -5.2, cal_max: 5.3 })
    renderBox(nv)

    const button = screen.getByText('Hide 0')

    fireEvent.click(button)
    expect(nv.volumes[0].colormapType).toBe(1)
    expect(nv.volumes[0].colormapNegative).toBe('winter')

    fireEvent.click(button)
    expect(nv.volumes[0].colormapType).toBe(0)
    expect(nv.volumes[0].colormapNegative).toBe('')
  })

  it('does not add a negative colormap for unsigned data', () => {
    const nv = makeVolumeNv({ cal_min: 0, cal_max: 5 })
    renderBox(nv)

    fireEvent.click(screen.getByText('Hide 0'))
    expect(nv.volumes[0].colormapType).toBe(1)
    expect(nv.volumes[0].colormapNegative).toBe('')
  })

  it('never clobbers a user-chosen negative colormap (symmetric)', () => {
    const nv = makeVolumeNv({ cal_min: -5.2, cal_max: 5.3, colormapNegative: 'winter' })
    renderBox(nv)

    const button = screen.getByText('Hide 0')

    fireEvent.click(button) // enable: must not re-assign or claim ownership
    expect(nv.volumes[0].colormapNegative).toBe('winter')

    fireEvent.click(button) // disable: must leave the user's negative map intact
    expect(nv.volumes[0].colormapNegative).toBe('winter')
  })

  it('enables the negative colormap for signed mesh layers', () => {
    const nv = makeMeshNv({ cal_min: -5.2, cal_max: 5.3 })
    renderBox(nv)

    fireEvent.click(screen.getByText('Hide 0'))
    expect(nv.setMeshLayerProperty).toHaveBeenCalledWith('mesh-1', 0, 'useNegativeCmap', true)
    expect(nv.setMeshLayerProperty).toHaveBeenCalledWith('mesh-1', 0, 'colormapNegative', 'winter')

    fireEvent.click(screen.getByText('Hide 0'))
    expect(nv.setMeshLayerProperty).toHaveBeenCalledWith('mesh-1', 0, 'useNegativeCmap', false)
    expect(nv.setMeshLayerProperty).toHaveBeenCalledWith('mesh-1', 0, 'colormapNegative', '')
  })
})
