import { html } from 'htm/preact'
import { AppProps } from './App'
import { Signal, computed, effect, useSignal } from '@preact/signals'

type SubMenuEntry = {
  label: string
  onClick: () => void
}

export const Menu = (props: AppProps) => {
  const { selection, selectionActive, nvArray } = props
  const nvArraySelected = computed(() =>
    selectionActive.value && selection.value.length > 0
      ? nvArray.value.filter((_, i) => selection.value.includes(i))
      : nvArray.value,
  )
  const multiImage = computed(() => nvArray.value.length > 1)

  effect(
    () =>
      selectionActive.value &&
      selection.value.length == 0 &&
      (selection.value = nvArray.value.map((_, i) => i)),
  )

  const ViewItems = [
    'Axial',
    'Sagittal',
    'Coronal',
    'Render',
    'MultiPlanarRender',
    'Colorbar',
    'Radiological',
    'Crosshair',
  ]
  const ViewFunctions = []

  // redo with direct components here
  const menuEntries: SubMenuEntry[] = [
    { label: 'Open', onClick: () => console.log('Not implemented yet - open') },
    { label: 'Save', onClick: () => console.log('Not implemented yet - save') },
    { label: 'Save As', onClick: () => console.log('Not implemented yet - save as') },
    { label: 'Close', onClick: () => console.log('Not implemented yet - close') },
  ]

  const addImageEntries: SubMenuEntry[] = [
    { label: 'File(s)', onClick: () => console.log('Not implemented yet - file') },
    { label: 'URL', onClick: () => console.log('Not implemented yet - url') },
    { label: 'DICOM Folder', onClick: () => console.log('Not implemented yet - dicom folder') },
  ]

  const viewEntries: SubMenuEntry[] = [
    { label: 'Axial', onClick: () => console.log('Not implemented yet - axial') },
    { label: 'Sagittal', onClick: () => console.log('Not implemented yet - sagittal') },
    { label: 'Coronal', onClick: () => console.log('Not implemented yet - coronal') },
    { label: 'Render', onClick: () => console.log('Not implemented yet - render') },
    {
      label: 'Multiplanar + Render',
      onClick: () => console.log('Not implemented yet - multiplanar render'),
    },
    { label: '------------', onClick: () => console.log('Not implemented yet - divider') },
    {
      label: 'Timeseries',
      onClick: () =>
        console.log(
          'Not implemented yet - timeseries (https://niivue.github.io/niivue/features/timeseries.html)',
        ),
    },
    { label: 'Reset View', onClick: () => console.log('Not implemented yet - reset view') },
  ]

  const overlayEntries: SubMenuEntry[] = [
    { label: 'Add', onClick: () => console.log('Not implemented yet - add') },
    { label: 'Remove', onClick: () => console.log('Not implemented yet - remove') },
    { label: 'Color', onClick: () => console.log('Not implemented yet - color') },
    { label: 'Hide', onClick: () => console.log('Not implemented yet - hide') },
  ]

  const homeEvent = () => {
    const url = new URL(location.href)
    location.href = url.origin + url.pathname
    location.reload()
  }

  const headerEntries: SubMenuEntry[] = [
    { label: 'Show Header', onClick: () => console.log('Not implemented yet - show') },
    { label: 'Set Header', onClick: () => console.log('Not implemented yet - set') },
  ]

  const resizeEntries: SubMenuEntry[] = [
    { label: 'Resize', onClick: () => console.log('Not implemented yet - resize') },
  ]

  return html`
    <div class="flex flex-wrap items-baseline gap-1">
      <${MenuButton} label="Home" onClick=${homeEvent} />
      <${MenuItemSelect} menuEntries=${headerEntries} />
      <${MenuItem} label="Add Image" menuEntries=${addImageEntries} />
      <${MenuItem} label="View" menuEntries=${viewEntries} />
      <${MenuItem} label="Resize" menuEntries=${resizeEntries} />
      <div class="border-r border-gray-700 h-4"></div>
      <${MenuItem} label="Overlay" menuEntries=${overlayEntries} />
      ${multiImage.value && html`<${ToggleButton} label="Select" state=${selectionActive} />`}
    </div>
    <span class="flex-grow"> text </span>
  `
}

export const MenuButton = ({ label, onClick }) => {
  return html`
    <div class="relative">
      <button class="hover:bg-gray-700 px-2 rounded-md h-6 align-middle" onClick=${onClick}>
        ${label}
      </button>
    </div>
  `
}

// maybe selection menu with arrow and option to keep selection?
export const ToggleButton = ({ label, state }: { label: string; state: Signal<boolean> }) => {
  return html`
    <div class="relative">
      <button
        class="hover:bg-gray-700 px-2 rounded-md h-6 align-middle ${state.value && 'bg-gray-700'}"
        onClick=${() => (state.value = !state.value)}
      >
        ${label}
      </button>
    </div>
  `
}

export const MenuItem = ({ label, menuEntries }) => {
  const isOpen = useSignal(false)
  const selectedElement = useSignal(0)

  return html`
    <div class="relative group">
      <button
        class="group-hover:bg-gray-700 px-2 rounded-l-md h-6 align-middle"
        onClick=${menuEntries[selectedElement.value].onClick}
      >
        ${label}
      </button>
      <button
        class="hover:bg-gray-700 px-2 rounded-r-md h-6 align-middle"
        onClick=${() => (isOpen.value = !isOpen.value)}
      >
        <${DownArrow} />
      </button>
      <div class="absolute cursor-pointer left-0">
        ${isOpen.value &&
        html`
          ${menuEntries.map(
            (item, index) => html`
              <button
                class="w-full px-2 py-1 text-left bg-gray-900 hover:bg-gray-700"
                onClick=${() => {
                  selectedElement.value = index
                  item.onClick()
                  isOpen.value = false
                }}
              >
                ${item.label}
              </button>
            `,
          )}
        `}
      </div>
    </div>
  `
}

export const MenuItemSelect = ({ menuEntries }) => {
  const isOpen = useSignal(false)
  const selectedElement = useSignal(0)

  return html`
    <div class="relative group">
      <button
        class="group-hover:bg-gray-700 px-2 rounded-l-md h-6 align-middle"
        onClick=${menuEntries[selectedElement.value].onClick}
      >
        ${menuEntries[selectedElement.value].label}
      </button>
      <button
        class="hover:bg-gray-700 px-2 rounded-r-md h-6 align-middle"
        onClick=${() => (isOpen.value = !isOpen.value)}
      >
        <${DownArrow} />
      </button>
      <div class="absolute cursor-pointer left-0">
        ${isOpen.value &&
        html`
          ${menuEntries.map(
            (item, index) => html`
              <button
                class="w-full px-2 py-1 text-left bg-gray-900 hover:bg-gray-700"
                onClick=${() => {
                  selectedElement.value = index
                  item.onClick()
                  isOpen.value = false
                }}
              >
                ${item.label}
              </button>
            `,
          )}
        `}
      </div>
    </div>
  `
}

function DownArrow() {
  return html`
    <svg
      class="w-2.5 h-2.5 ms-2.5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 10 6"
    >
      <path
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="m1 1 4 4 4-4"
      />
    </svg>
  `
}

export const Menu2 = (props: AppProps) => {
  return html`
    <header>
      <div class="group float-left">
        <button class="dropbtn">
          File
          <i class="fa fa-caret-down"></i>
        </button>
        <div class="hidden group-hover:block absolute">
          <a class="block float-none" id="SaveBitmap">Screen Shot</a>
          <a class="block float-none" id="ShowHeader">Show Header</a>
          <a class="linker" href="https://github.com/niivue/niivue">About</a>
        </div>
      </div>
      <div class="group float-left">
        <button class="dropbtn" data-toggle="dropdown">
          View
          <i class="fa fa-caret-down"></i>
        </button>
        <div class="hidden group-hover:block absolute">
          <a href="#" class="block float-none" id="|Axial">Axial</a>
          <a class="block float-none" id="|Sagittal">Sagittal</a>
          <a class="block float-none" id="|Coronal">Coronal</a>
          <a class="block float-none" id="|Render">Render</a>
          <a class="float-none dropdown-item-checked" id="|MultiPlanarRender">A+C+S+R</a>
          <a class="float-none divider dropdown-item-checked" id="Colorbar">Colorbar</a>
          <a class="block float-none" id="Radiological">Radiological</a>
          <a class="float-none dropdown-item-checked" id="Crosshair">Render Crosshair</a>
          <a class="block float-none" id="ClipPlane">Render Clip Plane</a>
        </div>
      </div>
      <div class="group float-left">
        <button class="dropbtn">
          Color
          <i class="fa fa-caret-down"></i>
        </button>
        <div class="hidden group-hover:block absolute">
          <a class="float-none dropdown-item-checked" id="!Gray">Gray</a>
          <a class="block float-none" id="!Plasma">Plasma</a>
          <a class="block float-none" id="!Viridis">Viridis</a>
          <a class="block float-none" id="!Inferno">Inferno</a>
          <a class="float-none divider dropdown-item-checked" id="BackColor">Dark Background</a>
        </div>
      </div>
      <div class="group float-left">
        <button class="dropbtn">
          Drag
          <i class="fa fa-caret-down"></i>
        </button>
        <div class="hidden group-hover:block absolute">
          <a class="float-none dropdown-item-checked" id="^contrast">Contrast</a>
          <a class="block float-none" id="^measurement">Measurement</a>
          <a class="block float-none" id="^pan">Pan</a>
          <a class="block float-none" id="^none">None</a>
        </div>
      </div>
      <div class="group float-left">
        <button class="dropbtn">
          Script
          <i class="fa fa-caret-down"></i>
        </button>
        <div class="hidden group-hover:block absolute">
          <a class="block float-none" id="_FLAIR">FLAIR</a>
          <a class="float-none dropdown-item-checked" id="_mni152">mni152</a>
          <a class="block float-none" id="_shear">CT</a>
          <a class="block float-none" id="_ct_perfusion">CT CBF</a>
          <a class="block float-none" id="_pcasl">pCASL</a>
          <a class="block float-none" id="_mesh">mesh</a>
        </div>
      </div>
    </header>
  `
}
