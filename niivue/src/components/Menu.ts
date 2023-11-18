import { html } from 'htm/preact'
import { AppProps } from './App'
import { computed, effect, useSignal } from '@preact/signals'

export const Menu = (props: AppProps) => {
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

  const menuItems = ['Open', 'Save', 'Save As', 'Close']
  const menuFunctions = [
    () => console.log('Not implemented yet - open'),
    () => console.log('Not implemented yet - save'),
    () => console.log('Not implemented yet - save as'),
    () => console.log('Not implemented yet - close'),
  ]

  return html`
    <div class="flex flex-wrap items-baseline gap-4">
      <${MenuItem} label="Home" menuItems=${menuItems} menuFunctions=${menuFunctions} />
      <${MenuItem} label="File" menuItems=${menuItems} menuFunctions=${menuFunctions} />
      <${MenuItem} label="View" menuItems=${menuItems} menuFunctions=${menuFunctions} />
      <${MenuItem} label="Resize" menuItems=${menuItems} menuFunctions=${menuFunctions} />
      <${MenuItem} label="Show Header" menuItems=${menuItems} menuFunctions=${menuFunctions} />
    </div>
    <div class="relative inline-block text-left">
      <div>
        <button
          type="button"
          class="inline-flex justify-center w-full rounded-md px-4 py-2 bg-gray-600 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none"
          id="options-menu"
          aria-haspopup="true"
          aria-expanded="true"
        >
          Options
          <svg
            class="-mr-1 ml-2 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M5 10a5 5 0 1110 0 5 5 0 01-10 0zm5-7a7 7 0 100 14A7 7 0 0010 3z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>

      <div
        class="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
      >
        <div class="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
          <a
            href="#"
            class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            role="menuitem"
            >Account settings</a
          >
          <a
            href="#"
            class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            role="menuitem"
            >Support</a
          >
          <a
            href="#"
            class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            role="menuitem"
            >Sign out</a
          >
        </div>
      </div>
    </div>
  `
}

export const MenuItem = ({ label, menuItems, menuFunctions }) => {
  const isOpen = useSignal(false)
  const selectedElement = useSignal(0)

  return html`
    <div class="relative">
      <button onClick=${menuFunctions[selectedElement.value]}>${label}</button>
      <button onClick=${() => (isOpen.value = !isOpen.value)}>▼</button>
      <div class="absolute cursor-pointer bg-gray-600 w-20">
        ${isOpen.value &&
        html`
          ${menuItems.map(
            (item, index) => html`
              <button
                class="block w-full text-left"
                onClick=${() => {
                  selectedElement.value = index
                  menuFunctions[index]()
                  isOpen.value = false
                }}
              >
                ${item}
              </button>
            `,
          )}
        `}
      </div>
    </div>
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
