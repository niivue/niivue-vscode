import { cleanup, fireEvent, render, screen } from '@testing-library/preact'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LabelSelectionPanel } from '../components/LabelSelectionPanel'
import { LabelInfo } from '../components/labelSelection'

afterEach(() => cleanup())

function labels(): LabelInfo[] {
  return [
    { value: 1, name: 'Cube', color: [255, 0, 0], visible: true },
    { value: 2, name: 'Sphere', color: [0, 255, 0], visible: true },
    { value: 3, name: 'Slice', color: [0, 0, 255], visible: false },
  ]
}

function renderPanel(over: Partial<Parameters<typeof LabelSelectionPanel>[0]> = {}) {
  const props = {
    labels: labels(),
    onLabelToggle: vi.fn(),
    onSelectAll: vi.fn(),
    onDeselectAll: vi.fn(),
    onClose: vi.fn(),
    ...over,
  }
  render(<LabelSelectionPanel {...props} />)
  return props
}

describe('LabelSelectionPanel', () => {
  it('renders one row per label and the visible/total counts', () => {
    renderPanel()
    expect(screen.getByText('Cube')).toBeTruthy()
    expect(screen.getByText('Sphere')).toBeTruthy()
    expect(screen.getByText('Slice')).toBeTruthy()
    expect(screen.getByText(/Label Visibility \(3\)/)).toBeTruthy()
    expect(screen.getByText(/2 of 3 visible/)).toBeTruthy() // labels 1 and 2 visible
  })

  it('toggles a visible label off when its checkbox is clicked', () => {
    const { onLabelToggle } = renderPanel()
    fireEvent.click(document.getElementById('label-1') as HTMLInputElement)
    expect(onLabelToggle).toHaveBeenCalledWith(1, false)
  })

  it('toggles a label via a row click (on a non-input part of the row)', () => {
    const { onLabelToggle } = renderPanel()
    fireEvent.click(screen.getByText('#3')) // label 3 is hidden -> turn on
    expect(onLabelToggle).toHaveBeenCalledTimes(1)
    expect(onLabelToggle).toHaveBeenCalledWith(3, true)
  })

  it('wires the All / None / Close actions', () => {
    const { onSelectAll, onDeselectAll, onClose } = renderPanel()
    fireEvent.click(screen.getByText('All'))
    fireEvent.click(screen.getByText('None'))
    fireEvent.click(screen.getByText('Close'))
    expect(onSelectAll).toHaveBeenCalledTimes(1)
    expect(onDeselectAll).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows the search box only for large label sets and filters by name', () => {
    renderPanel() // 3 labels -> no search box
    expect(screen.queryByPlaceholderText('Search labels...')).toBeNull()
    cleanup()

    const many: LabelInfo[] = Array.from({ length: 12 }, (_, i) => ({
      value: i + 1,
      name: `Region ${i + 1}`,
      color: [0, 0, 0],
      visible: true,
    }))
    renderPanel({ labels: many })
    const search = screen.getByPlaceholderText('Search labels...')
    fireEvent.change(search, { target: { value: 'Region 2' } })
    expect(screen.getByText('Region 2')).toBeTruthy()
    expect(screen.queryByText('Region 1')).toBeNull()
  })
})
