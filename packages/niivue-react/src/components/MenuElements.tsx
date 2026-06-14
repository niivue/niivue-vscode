import { Signal, computed, effect, signal, useSignal } from '@preact/signals'
import { useRef } from 'preact/hooks'

export const activeMenu = signal<string | null>(null)

if (typeof window !== 'undefined') {
  window.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (!target.closest('.group') && !target.closest('dialog') && !target.closest('button[data-testid^="menu-item-dropdown-"]')) {
      activeMenu.value = null
    }
  })
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') activeMenu.value = null
  })
}

export const MenuEntry = ({ label, onClick, isOpen, visible, shortcut, keepOpen }: any) => {
  if (visible && !visible.value) return null
  const ariaLabel = shortcut ? `${label} (Keyboard shortcut: ${shortcut})` : label
  return (
    <button
      className="nv-menu-item"
      onClick={() => {
        onClick()
        if (!keepOpen) activeMenu.value = null
      }}
      title={shortcut ? `Keyboard shortcut: ${shortcut}` : undefined}
      aria-label={ariaLabel}
    >
      <span>{label}</span>
      {shortcut && <span className="nv-menu-item-shortcut">{shortcut}</span>}
    </button>
  )
}

export const MenuItem = ({ label, onClick, children, visible, shortcut }: any) => {
  if (visible && !visible.value) return null
  const isOpen = computed(() => activeMenu.value === label)
  setChildren(children, isOpen)

  return (
    <div className="relative group">
      <button
        className="nv-topbtn"
        onClick={() => {
          activeMenu.value = null
          if (onClick) onClick()
        }}
        title={shortcut ? `Keyboard shortcut: ${shortcut}` : undefined}
      >
        {label}
      </button>
      <button
        className="nv-topbtn"
        onClick={(e) => {
          e.stopPropagation()
          activeMenu.value = activeMenu.value === label ? null : label
        }}
        data-testid={`menu-item-dropdown-${label}`}
      >
        <DownArrow />
      </button>
      {isOpen.value && (
        <div className="nv-menu-panel absolute left-0 z-50 min-w-full">
          {children}
        </div>
      )}
    </div>
  )
}

export const ToggleEntry = ({ label, state, shortcut }: any) => {
  return (
    <div className="relative group">
      <button
        className={`nv-menu-item${state.value ? ' is-active' : ''}`}
        onClick={toggle(state)}
        title={shortcut ? `Keyboard shortcut: ${shortcut}` : undefined}
      >
        <span>{label}</span>
        {shortcut && <span className="nv-menu-item-shortcut">{shortcut}</span>}
      </button>
    </div>
  )
}

// A compact numeric stepper for menu panels (e.g. tile spacing). The row itself
// is non-interactive; only the -/+ buttons act. The menu stays open while
// nudging because the buttons render inside the menu's `.group` wrapper (the
// outside-click handler ignores clicks there); stopPropagation is belt-and-
// suspenders against any future listener higher up.
export const StepperEntry = ({ label, value, min = 0, max = 100, step = 1, onChange, format }: any) => {
  const clamp = (v: number) => Math.min(max, Math.max(min, v))
  const nudge = (delta: number) => (e: MouseEvent) => {
    e.stopPropagation()
    onChange(clamp(value.value + delta))
  }
  return (
    <div className="nv-stepper">
      <span>{label}</span>
      <span className="nv-stepper-controls">
        <button
          type="button"
          className="nv-stepper-btn"
          onClick={nudge(-step)}
          disabled={value.value <= min}
          aria-label={`Decrease ${label}`}
        >
          -
        </button>
        <span
          className="nv-stepper-value"
          data-testid={`stepper-value-${label}`}
          aria-live="polite"
        >
          {format ? format(value.value) : value.value}
        </span>
        <button
          type="button"
          className="nv-stepper-btn"
          onClick={nudge(step)}
          disabled={value.value >= max}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </span>
    </div>
  )
}

export const MenuButton = ({
  label,
  onClick,
  shortcut,
}: {
  label: string
  onClick: () => void
  shortcut?: string
}) => {
  return (
    <div className="relative">
      <button
        className="nv-topbtn"
        onClick={onClick}
        title={shortcut ? `Keyboard shortcut: ${shortcut}` : undefined}
      >
        {label}
      </button>
    </div>
  )
}

export const MenuToggle = ({ label, state, shortcut }: any) => {
  return (
    <div className="relative">
      <button
        className={`nv-topbtn${state.value ? ' is-active' : ''}`}
        onClick={toggle(state)}
        title={shortcut ? `Keyboard shortcut: ${shortcut}` : undefined}
      >
        {label}
      </button>
    </div>
  )
}

export const HeaderDialog = ({ nvArraySelected, isOpen }: any) => {
  const headerDialog = useRef<HTMLDialogElement | null>(null)
  const headerInfo = useSignal('')

  const showHeader = () => {
    headerInfo.value = nvArraySelected.value?.[0]?.volumes?.[0]?.hdr?.toFormattedString() || ''
    if (headerInfo.value && headerDialog.current) {
      headerDialog.current.showModal()
    }
  }

  effect(() => {
    if (isOpen.value) {
      showHeader()
      toggle(isOpen)()
    }
  })

  return (
    <dialog className="text-sm p-2 bg-gray-200 rounded-md" ref={headerDialog}>
      <form>
        {headerInfo.value.split('\n').map((line, index) => (
          <p key={index}>{line}</p>
        ))}
        <button
          className="bg-gray-300 border-2 border-gray-500 rounded-md w-16 mx-auto block"
          formMethod="dialog"
          value="cancel"
        >
          Close
        </button>
      </form>
    </dialog>
  )
}

export const ImageSelect = ({ label, state, children, visible }: any) => {
  if (visible && !visible.value) return null
  const isOpen = computed(() => activeMenu.value === label)
  setChildren(children, isOpen)

  return (
    <div className="relative group">
      <button
        className={`nv-topbtn${state.value ? ' is-active' : ''}`}
        onClick={() => {
          activeMenu.value = null
          state.value = !state.value
        }}
      >
        {label}
      </button>
      <button
        className="nv-topbtn"
        onClick={(e) => {
          e.stopPropagation()
          activeMenu.value = activeMenu.value === label ? null : label
          state.value = true
        }}
      >
        <DownArrow />
      </button>
      {isOpen.value && (
        <div className="nv-menu-panel absolute left-0 z-50">{children}</div>
      )}
    </div>
  )
}

const DownArrow = () => (
  <svg
    className="w-2.5 h-2.5 ms-1"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 10 6"
  >
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="m1 1 4 4 4-4"
    />
  </svg>
)

// This is necessary because one child is given directly while multiple children are given as an array
function setChildren(children: any, isOpen: Signal<boolean>) {
  if (children) {
    if (Array.isArray(children)) {
      children.forEach((child, _) => {
        if (child?.props) {
          child.props.isOpen = isOpen
        }
      })
    } else {
      if (children?.props) {
        children.props.isOpen = isOpen
      }
    }
  }
}

export function toggle(state: Signal<boolean>) {
  return () => (state.value = !state.value)
}
