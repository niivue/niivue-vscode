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
}

export const MenuEntry = ({ label, onClick, isOpen, visible, shortcut, keepOpen }: any) => {
  if (visible && !visible.value) return null
  const ariaLabel = shortcut ? `${label} (Keyboard shortcut: ${shortcut})` : label
  return (
    <button
      className="w-full px-2 py-1 text-left bg-gray-900 hover:bg-gray-700 flex justify-between items-center"
      onClick={() => {
        onClick()
        if (!keepOpen) activeMenu.value = null
      }}
      title={shortcut ? `Keyboard shortcut: ${shortcut}` : undefined}
      aria-label={ariaLabel}
    >
      <span>{label}</span>
      {shortcut && <span className="text-xs text-gray-400 ml-4">{shortcut}</span>}
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
        className="group-hover:bg-gray-700 px-2 rounded-l-md h-6 align-middle"
        onClick={() => {
          activeMenu.value = null
          if (onClick) onClick()
        }}
        title={shortcut ? `Keyboard shortcut: ${shortcut}` : undefined}
      >
        {label}
      </button>
      <button
        className="hover:bg-gray-700 pr-2 rounded-r-md h-6 align-middle"
        onClick={(e) => {
          e.stopPropagation()
          activeMenu.value = activeMenu.value === label ? null : label
        }}
        data-testid={`menu-item-dropdown-${label}`}
      >
        <DownArrow />
      </button>
      <div className="absolute cursor-pointer left-0 z-50 min-w-full">
        {isOpen.value && children}
      </div>
    </div>
  )
}

export const ToggleEntry = ({ label, state, shortcut }: any) => {
  return (
    <div className="relative group">
      <button
        className={`w-full px-2 py-1 text-left hover:bg-gray-700 flex justify-between items-center ${
          state.value ? 'bg-gray-600' : 'bg-gray-900'
        }`}
        onClick={toggle(state)}
        title={shortcut ? `Keyboard shortcut: ${shortcut}` : undefined}
      >
        <span>{label}</span>
        {shortcut && <span className="text-xs text-gray-400 ml-4">{shortcut}</span>}
      </button>
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
        className="hover:bg-gray-700 px-2 rounded-md h-6 align-middle"
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
        className={`px-2 rounded-md h-6 align-middle hover:bg-gray-700 ${
          state.value && 'bg-gray-500'
        }`}
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
        className={`group-hover:bg-gray-700 px-2 rounded-l-md h-6 align-middle ${
          state.value && 'bg-gray-500'
        }`}
        onClick={() => {
          activeMenu.value = null
          state.value = !state.value
        }}
      >
        {label}
      </button>
      <button
        className="hover:bg-gray-700 pr-2 rounded-r-md h-6 align-middle"
        onClick={(e) => {
          e.stopPropagation()
          activeMenu.value = activeMenu.value === label ? null : label
          state.value = true
        }}
      >
        <DownArrow />
      </button>
      <div className="absolute cursor-pointer left-0 z-50">{isOpen.value && children}</div>
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
