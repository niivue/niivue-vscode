import { cleanup, render } from '@testing-library/preact'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  useKeyboardShortcuts,
  type KeyboardShortcutHandlers,
} from '../hooks/useKeyboardShortcuts'

// A do-nothing component whose only job is to mount the hook under test.
function Harness(props: { handlers: KeyboardShortcutHandlers; enabled?: boolean }) {
  useKeyboardShortcuts(props.handlers, props.enabled)
  return null
}

const HANDLER_NAMES: (keyof KeyboardShortcutHandlers)[] = [
  'onViewAxial', 'onViewSagittal', 'onViewCoronal', 'onViewRender', 'onViewMultiplanar',
  'onViewMultiplanarTimeseries', 'onCycleViewMode', 'onCycleClipPlane', 'onVolumeNext',
  'onVolumePrev', 'onResetView', 'onToggleInterpolation', 'onToggleColorbar',
  'onToggleRadiological', 'onToggleCrosshair', 'onToggleZoomMode', 'onAddImage',
  'onAddOverlay', 'onColorscale', 'onHideUI', 'onShowHeader', 'onCrosshairSuperior',
  'onCrosshairInferior',
]

// Every handler wired as a spy. Typed as the hook's interface so it drops
// straight into the component; the values are still vi.fn() spies at runtime, so
// `expect(handlers[name]).toHaveBeenCalled...` works for assertions.
function makeHandlers(): KeyboardShortcutHandlers {
  return Object.fromEntries(HANDLER_NAMES.map((n) => [n, vi.fn()])) as KeyboardShortcutHandlers
}

// Dispatch a real KeyboardEvent. Defaults to window (the hook listens there);
// pass a target (e.g. an <input>) to exercise the focus guard via bubbling.
function fireKey(init: KeyboardEventInit, target: EventTarget = window): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init })
  target.dispatchEvent(event)
  return event
}

function expectOnly(handlers: KeyboardShortcutHandlers, called: keyof KeyboardShortcutHandlers) {
  for (const name of HANDLER_NAMES) {
    if (name === called) expect(handlers[name], `${name} should fire`).toHaveBeenCalledTimes(1)
    else expect(handlers[name], `${name} should not fire`).not.toHaveBeenCalled()
  }
}

afterEach(() => cleanup())

// key -> the single handler it must invoke. Distinct modifier combos mean only
// the intended shortcut matches, so each row also proves nothing else fires.
const CASES: Array<[string, KeyboardEventInit, keyof KeyboardShortcutHandlers]> = [
  ['1 -> Axial', { key: '1' }, 'onViewAxial'],
  ['2 -> Sagittal', { key: '2' }, 'onViewSagittal'],
  ['3 -> Coronal', { key: '3' }, 'onViewCoronal'],
  ['4 -> Render', { key: '4' }, 'onViewRender'],
  ['5 -> Multiplanar', { key: '5' }, 'onViewMultiplanar'],
  ['6 -> Multiplanar timeseries', { key: '6' }, 'onViewMultiplanarTimeseries'],
  ['v -> cycle view mode', { key: 'v' }, 'onCycleViewMode'],
  ['c -> cycle clip plane', { key: 'c' }, 'onCycleClipPlane'],
  ['ArrowRight -> next volume', { key: 'ArrowRight' }, 'onVolumeNext'],
  ['ArrowLeft -> prev volume', { key: 'ArrowLeft' }, 'onVolumePrev'],
  ['r -> reset view', { key: 'r' }, 'onResetView'],
  ['i -> interpolation', { key: 'i' }, 'onToggleInterpolation'],
  ['b -> colorbar', { key: 'b' }, 'onToggleColorbar'],
  ['x -> radiological', { key: 'x' }, 'onToggleRadiological'],
  ['m -> crosshair', { key: 'm' }, 'onToggleCrosshair'],
  ['z -> zoom mode', { key: 'z' }, 'onToggleZoomMode'],
  ['s -> colorscale', { key: 's' }, 'onColorscale'],
  ['u -> hide UI', { key: 'u' }, 'onHideUI'],
  ['Shift+U -> crosshair superior', { key: 'u', shiftKey: true }, 'onCrosshairSuperior'],
  ['Shift+D -> crosshair inferior', { key: 'd', shiftKey: true }, 'onCrosshairInferior'],
  ['Ctrl+Shift+O -> add image', { key: 'o', ctrlKey: true, shiftKey: true }, 'onAddImage'],
  ['Ctrl+L -> add overlay', { key: 'l', ctrlKey: true }, 'onAddOverlay'],
  ['Ctrl+Shift+H -> show header', { key: 'h', ctrlKey: true, shiftKey: true }, 'onShowHeader'],
]

describe('useKeyboardShortcuts', () => {
  it.each(CASES)('routes %s', (_label, init, handler) => {
    const handlers = makeHandlers()
    render(<Harness handlers={handlers} />)
    fireKey(init)
    expectOnly(handlers, handler)
  })

  it('preventDefault is called for a matched shortcut, not for an unmatched key', () => {
    render(<Harness handlers={makeHandlers()} />)
    expect(fireKey({ key: '1' }).defaultPrevented).toBe(true)
    expect(fireKey({ key: 'q' }).defaultPrevented).toBe(false)
  })

  it('does nothing for an unmapped key', () => {
    const handlers = makeHandlers()
    render(<Harness handlers={handlers} />)
    fireKey({ key: 'q' })
    for (const name of HANDLER_NAMES) expect(handlers[name]).not.toHaveBeenCalled()
  })

  it.each(['INPUT', 'TEXTAREA'])('ignores shortcuts while focus is in a %s', (tag) => {
    const handlers = makeHandlers()
    render(<Harness handlers={handlers} />)
    const field = document.createElement(tag)
    document.body.appendChild(field)
    try {
      fireKey({ key: '1' }, field) // bubbles to window, but target is the field
      expect(handlers.onViewAxial).not.toHaveBeenCalled()
    } finally {
      field.remove()
    }
  })

  it('ignores shortcuts while focus is in a contentEditable element', () => {
    const handlers = makeHandlers()
    render(<Harness handlers={handlers} />)
    const div = document.createElement('div')
    // jsdom does not derive isContentEditable from the attribute, so set it directly.
    Object.defineProperty(div, 'isContentEditable', { value: true })
    document.body.appendChild(div)
    try {
      fireKey({ key: '1' }, div)
      expect(handlers.onViewAxial).not.toHaveBeenCalled()
    } finally {
      div.remove()
    }
  })

  it('does not fire when disabled', () => {
    const handlers = makeHandlers()
    render(<Harness handlers={handlers} enabled={false} />)
    fireKey({ key: '1' })
    expect(handlers.onViewAxial).not.toHaveBeenCalled()
  })

  it('detaches its listener on unmount', () => {
    const handlers = makeHandlers()
    const { unmount } = render(<Harness handlers={handlers} />)
    unmount()
    fireKey({ key: '1' })
    expect(handlers.onViewAxial).not.toHaveBeenCalled()
  })

  it('skips a shortcut whose handler is not provided (no throw)', () => {
    // Only one handler wired; an unrelated key must be a no-op, not a crash.
    const onViewAxial = vi.fn()
    render(<Harness handlers={{ onViewAxial } as KeyboardShortcutHandlers} />)
    expect(() => fireKey({ key: 'b' })).not.toThrow()
    fireKey({ key: '1' })
    expect(onViewAxial).toHaveBeenCalledTimes(1)
  })
})
