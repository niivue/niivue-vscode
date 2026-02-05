import { render } from '@testing-library/preact'
import { describe, expect, it, vi } from 'vitest'
import StreamlitViewer from '../src/StreamlitViewer'

// Mock Streamlit API
const mockStreamlit = {
  setComponentReady: vi.fn(),
  setFrameHeight: vi.fn(),
  setComponentValue: vi.fn(),
  RENDER_EVENT: 'streamlit:render',
}

;(global as any).Streamlit = mockStreamlit

describe('StreamlitViewer', () => {
  it('should render without crashing', () => {
    const { container } = render(<StreamlitViewer />)
    expect(container).toBeInTheDocument()
  })

  it('should set component ready on mount', () => {
    render(<StreamlitViewer />)
    expect(mockStreamlit.setComponentReady).toHaveBeenCalled()
  })

  it('should handle styled=true to show StyledViewer', () => {
    const args = {
      styled: true,
      nifti_data: '',
      filename: '',
      height: 600,
    }

    const event = new CustomEvent(mockStreamlit.RENDER_EVENT, {
      detail: { args },
    })

    const { container } = render(<StreamlitViewer />)
    window.dispatchEvent(event)

    // Should contain elements from styled viewer
    expect(container.querySelector('.niivue-container')).toBeTruthy()
  })

  it('should handle styled=false to show UnstyledCanvas', () => {
    const args = {
      styled: false,
      nifti_data: '',
      filename: '',
      height: 600,
    }

    const event = new CustomEvent(mockStreamlit.RENDER_EVENT, {
      detail: { args },
    })

    const { container } = render(<StreamlitViewer />)
    window.dispatchEvent(event)

    // Should contain canvas element
    expect(container.querySelector('canvas')).toBeTruthy()
  })
})
