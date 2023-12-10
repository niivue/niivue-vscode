import { Signal, effect, useSignal } from '@preact/signals'
import { html } from 'htm/preact'
import { useRef } from 'preact/hooks'

export const MenuEntry = ({ label, onClick, isOpen, visible }: any) => {
  if (visible && !visible.value) return html``
  return html`
    <button
      class="w-full px-2 py-1 text-left bg-gray-900 hover:bg-gray-700"
      onClick=${() => {
        onClick()
        isOpen.value = false
      }}
    >
      ${label}
    </button>
  `
}

export const MenuItem = ({ label, onClick, children, visible }: any) => {
  if (visible && !visible.value) return html``
  const isOpen = useSignal(false)
  setChildren(children, isOpen)

  return html`
    <div class="relative group">
      <button
        class="group-hover:bg-gray-700 px-2 rounded-l-md h-6 align-middle"
        onClick=${() => {
          onClick()
          isOpen.value = false
        }}
      >
        ${label}
      </button>
      <button
        class="hover:bg-gray-700 pr-2 rounded-r-md h-6 align-middle"
        onClick=${toggle(isOpen)}
      >
        <${DownArrow} />
      </button>
      <div class="absolute cursor-pointer left-0 z-50 min-w-full">${isOpen.value && children}</div>
    </div>
  `
}

export const ToggleEntry = ({ label, state }: any) => {
  return html`
    <div class="relative group">
      <button
        class="w-full px-2 py-1 text-left hover:bg-gray-700 ${state.value
          ? 'bg-gray-600'
          : 'bg-gray-900'}"
        onClick=${toggle(state)}
      >
        ${label}
      </button>
    </div>
  `
}

export const MenuButton = ({ label, onClick }: { label: string; onClick: Function }) => {
  return html`
    <div class="relative">
      <button class="hover:bg-gray-700 px-2 rounded-md h-6 align-middle" onClick=${onClick}>
        ${label}
      </button>
    </div>
  `
}

export const HeaderDialog = ({ nvArraySelected, isOpen }: any) => {
  const headerDialog = useRef<HTMLDialogElement>()
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
  return html`
    <dialog class="text-sm p-2 bg-gray-200 rounded-md" ref=${headerDialog}>
      <form>
        ${headerInfo.value.split('\n').map((line) => html` <p>${line}</p> `)}
        <button
          class="bg-gray-300 border-2 border-gray-500 rounded-md w-16 mx-auto block"
          formmethod="dialog"
          value="cancel"
        >
          Close
        </button>
      </form>
    </dialog>
  `
}

export const ImageSelect = ({ label, state, children, visible }: any) => {
  if (visible && !visible.value) return html``
  const isOpen = useSignal(false)
  setChildren(children, isOpen)

  return html`
    <div class="relative group">
      <button
        class="group-hover:bg-gray-700 px-2 rounded-l-md h-6 align-middle ${state.value &&
        'bg-gray-700'}"
        onClick=${toggle(state)}
      >
        ${label}
      </button>
      <button
        class="hover:bg-gray-700 pr-2 rounded-r-md h-6 align-middle"
        onClick=${toggle(isOpen)}
      >
        <${DownArrow} />
      </button>
      <div class="absolute cursor-pointer left-0 z-50">${isOpen.value && children}</div>
    </div>
  `
}

const DownArrow = () => html`
  <svg class="w-2.5 h-2.5 ms-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
    <path
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="m1 1 4 4 4-4"
    />
  </svg>
`

// This is neccesarry because one child is given directly while multiple children are given as an array
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
