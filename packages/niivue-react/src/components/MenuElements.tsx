import { Signal, effect, useSignal } from '@preact/signals'
import { useEffect, useRef } from 'preact/hooks'

export const MenuEntry = ({ label, onClick, isOpen, visible }: any) => {
  if (visible && !visible.value) return null
  return (
    <button
      className="w-full px-2 py-1 text-left bg-gray-900 hover:bg-gray-700"
      onClick={() => {
        onClick()
        isOpen.value = false
      }}
    >
      {label}
    </button>
  )
}

export const MenuItem = ({ label, onClick, children, visible }: any) => {
  if (visible && !visible.value) return null
  const isOpen = useSignal(false)
  setChildren(children, isOpen)

  useEffect(() => {
    if (!isOpen.value) return // Only add listener when menu is open

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        isOpen.value = false
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen.value])

  return (
    <div className="relative group">
      <button
        className="group-hover:bg-gray-700 px-2 rounded-l-md h-6 align-middle"
        onClick={() => {
          onClick()
          isOpen.value = false
        }}
      >
        {label}
      </button>
      <button
        className="hover:bg-gray-700 pr-2 rounded-r-md h-6 align-middle"
        onClick={toggle(isOpen)}
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

export const ToggleEntry = ({ label, state }: any) => {
  return (
    <div className="relative group">
      <button
        className={`w-full px-2 py-1 text-left hover:bg-gray-700 ${
          state.value ? 'bg-gray-600' : 'bg-gray-900'
        }`}
        onClick={toggle(state)}
      >
        {label}
      </button>
    </div>
  )
}

export const MenuButton = ({ label, onClick }: { label: string; onClick: () => void }) => {
  return (
    <div className="relative">
      <button className="hover:bg-gray-700 px-2 rounded-md h-6 align-middle" onClick={onClick}>
        {label}
      </button>
    </div>
  )
}

export const MenuToggle = ({ label, state }: any) => {
  return (
    <div className="relative">
      <button
        className={`px-2 rounded-md h-6 align-middle hover:bg-gray-700 ${
          state.value && 'bg-gray-500'
        }`}
        onClick={toggle(state)}
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

export const KeyboardControlDialog = ({ isOpen }: any) => {
  const keyboardDialog = useRef<HTMLDialogElement | null>(null)

  effect(() => {
    if (isOpen.value) {
      if (keyboardDialog.current) {
        keyboardDialog.current.showModal()
      }
      toggle(isOpen)()
    }
  })

  const keyboardControls = [
    {
      category: 'Mouse Controls',
      shortcuts: [
        { keys: 'Right Mouse', description: 'Adjust contrast/brightness (windowing)' },
        { keys: 'Right Mouse (Zoom mode)', description: 'Drag to zoom' },
        { keys: 'Middle Mouse', description: 'Drag to pan' },
        { keys: 'Mouse Scroll', description: 'Change slice in currently hovered image' },
        { keys: 'Shift + Mouse', description: '2D dragging and 3D viewplane rotation' },
      ],
    },
    {
      category: 'Navigation',
      shortcuts: [
        { keys: '← →', description: 'Change volume in 4D images' },
        { keys: 'V', description: 'Cycle through view modes' },
        { keys: 'C', description: 'Cycle through clip plane orientations in 3D render' },
      ],
    },
    {
      category: 'Crosshair Movement',
      shortcuts: [
        { keys: 'H', description: 'Move crosshair to R (Right)' },
        { keys: 'L', description: 'Move crosshair to L (Left)' },
        { keys: 'J', description: 'Move crosshair to P (Posterior)' },
        { keys: 'K', description: 'Move crosshair to A (Anterior)' },
        { keys: 'Ctrl+U', description: 'Move crosshair to S (Superior)' },
        { keys: 'Ctrl+D', description: 'Move crosshair to I (Inferior)' },
      ],
    },
    {
      category: 'Menu & Dialog Controls',
      shortcuts: [
        { keys: 'ESC', description: 'Close menus and dialogs' },
        { keys: 'Enter', description: 'Apply changes in ColorScale dialog' },
      ],
    },
  ]

  return (
    <dialog className="text-sm p-4 bg-gray-200 rounded-md max-w-2xl" ref={keyboardDialog}>
      <form>
        <h2 className="text-lg font-bold mb-3">Keyboard Controls</h2>
        {keyboardControls.map((section, idx) => (
          <div key={idx} className="mb-3">
            <h3 className="font-semibold mb-1">{section.category}</h3>
            <table className="w-full text-left mb-2">
              <tbody>
                {section.shortcuts.map((shortcut, sidx) => (
                  <tr key={sidx}>
                    <td className="font-mono bg-gray-300 px-2 py-1 rounded mr-2 w-1/3">
                      {shortcut.keys}
                    </td>
                    <td className="px-2 py-1">{shortcut.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        <button
          className="bg-gray-300 border-2 border-gray-500 rounded-md px-4 py-1 mx-auto block"
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
  const isOpen = useSignal(false)
  setChildren(children, isOpen)

  useEffect(() => {
    if (!isOpen.value) return // Only add listener when menu is open

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        isOpen.value = false
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen.value])

  return (
    <div className="relative group">
      <button
        className={`group-hover:bg-gray-700 px-2 rounded-l-md h-6 align-middle ${
          state.value && 'bg-gray-500'
        }`}
        onClick={toggle(state)}
      >
        {label}
      </button>
      <button
        className="hover:bg-gray-700 pr-2 rounded-r-md h-6 align-middle"
        onClick={() => {
          toggle(isOpen)()
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
