import { render } from '@testing-library/preact'
import { describe, expect, it } from 'vitest'
import { UnstyledCanvas } from '../src/components/UnstyledCanvas'

describe('UnstyledCanvas', () => {
  it('should render a canvas element', () => {
    const { container } = render(
      <UnstyledCanvas
        niftiData={null}
        filename=""
        overlays={[]}
        viewMode="axial"
        settings={{}}
        height={600}
      />,
    )

    expect(container.querySelector('canvas')).toBeInTheDocument()
  })

  it('should set correct height', () => {
    const { container } = render(
      <UnstyledCanvas
        niftiData={null}
        filename=""
        overlays={[]}
        viewMode="axial"
        settings={{}}
        height={800}
      />,
    )

    const canvas = container.querySelector('canvas')
    expect(canvas?.parentElement?.style.height).toContain('800')
  })

  it('should handle empty data gracefully', () => {
    const { container } = render(
      <UnstyledCanvas
        niftiData={null}
        filename=""
        overlays={[]}
        viewMode="multiplanar"
        settings={{}}
        height={600}
      />,
    )

    expect(container).toBeInTheDocument()
  })
})
