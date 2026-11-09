import { signal } from '@preact/signals'
import { cleanup, render } from '@testing-library/preact'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ScalingBox } from '../components/ScalingBox'

vi.mock('@niivue/niivue', () => ({
  SLICE_TYPE: { AXIAL: 0, CORONAL: 1, SAGITTAL: 2, MULTIPLANAR: 3, RENDER: 4 },
}))

afterEach(cleanup)

describe('ScalingBox colormap list', () => {
  it('offers the continuous colormaps of a volume, not its label tables', () => {
    const nv = {
      volumes: [{ calMin: 0, calMax: 1, opacity: 1, colormap: 'gray' }],
      meshes: [],
      colormaps: ['gray', 'hot', 'freesurfer', 'itksnap'],
      colormapNames: vi.fn((kind?: string) => (kind === 'continuous' ? ['gray', 'hot'] : [])),
    }
    const { container } = render(
      <ScalingBox
        nvArraySelected={signal([nv])}
        selectedOverlayNumber={signal(0)}
        overlayMenu={signal(true)}
      />,
    )

    const options = [...container.querySelectorAll('select option')].map((o) => o.textContent)
    expect(options).toEqual(['symmetric', 'gray', 'hot'])
  })

  it("selects the overlay's colormap when NiiVue lists it capitalised", () => {
    const nv = {
      volumes: [
        { calMin: 0, calMax: 1, opacity: 1, colormap: 'gray' },
        { calMin: 0, calMax: 1, opacity: 1, colormap: 'redyell' },
      ],
      meshes: [],
      colormapNames: vi.fn(() => ['Gray', 'Redyell']),
    }
    const { container } = render(
      <ScalingBox
        nvArraySelected={signal([nv])}
        selectedOverlayNumber={signal(1)}
        overlayMenu={signal(true)}
      />,
    )

    expect(container.querySelector('select')!.value).toBe('Redyell')
  })

  it('selects symmetric for warm with a negative colormap', () => {
    const nv = {
      volumes: [
        { calMin: 0, calMax: 1, opacity: 1, colormap: 'gray' },
        { calMin: 0, calMax: 1, opacity: 1, colormap: 'warm', colormapNegative: 'winter' },
      ],
      meshes: [],
      colormapNames: vi.fn(() => ['Gray', 'Warm', 'Winter']),
    }
    const { container } = render(
      <ScalingBox
        nvArraySelected={signal([nv])}
        selectedOverlayNumber={signal(1)}
        overlayMenu={signal(true)}
      />,
    )

    expect(container.querySelector('select')!.value).toBe('symmetric')
  })
})
