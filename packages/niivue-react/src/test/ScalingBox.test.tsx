import { signal } from '@preact/signals'
import { fireEvent, render, screen } from '@testing-library/preact'
import { describe, expect, it, vi } from 'vitest'
import { ScalingBox } from '../components/ScalingBox'

// Mock niivue to avoid webgl context issues in jsdom
vi.mock('@niivue/niivue', () => ({
  Niivue: vi.fn(),
}))

function makeVolumeNv() {
  return {
    volumes: [
      {
        colormap: 'gray',
        colormapInvert: false,
        colormapType: 0,
        opacity: 1,
        cal_min: 0,
        cal_max: 1,
      },
    ],
    meshes: [],
    colormaps: () => ['gray', 'warm'],
    updateGLVolume: vi.fn(),
  }
}

function renderBox(nv: ReturnType<typeof makeVolumeNv>) {
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
    const nv = makeVolumeNv()
    nv.volumes[0].colormapType = 1
    renderBox(nv)

    // Active state uses the white background highlight, matching the Invert button.
    const button = screen.getByText('Hide 0')
    expect(button.className).toContain('bg-white')
  })
})
