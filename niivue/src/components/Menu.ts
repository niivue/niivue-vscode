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

  const homeEvent = () => {
    const url = new URL(location.href);
    location.href = url.origin + url.pathname;
    location.reload()
  }

  return html`
    <div class="flex flex-wrap items-baseline gap-1">
      <button class="hover:bg-gray-700 px-2 rounded-md h-6 align-middle" onClick=${homeEvent}>Home</button>
      <${MenuItem} label="File" menuItems=${menuItems} menuFunctions=${menuFunctions} />
      <${MenuItem} label="View" menuItems=${menuItems} menuFunctions=${menuFunctions} />
      <${MenuItem} label="Resize" menuItems=${menuItems} menuFunctions=${menuFunctions} />
      <${MenuItem} label="Show Header" menuItems=${menuItems} menuFunctions=${menuFunctions} />
    </div>
    <span class="flex-grow"> text </span>
  `
}

export const MenuItem = ({ label, menuItems, menuFunctions }) => {
  const isOpen = useSignal(false)
  const selectedElement = useSignal(0)

  return html`
    <div class="relative group">
      <button
        class="group-hover:bg-gray-700 px-2 rounded-l-md h-6 align-middle"
        onClick=${menuFunctions[selectedElement.value]}
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
          ${menuItems.map(
            (item, index) => html`
              <button
                class="w-full px-2 py-1 text-left bg-gray-900 hover:bg-gray-700"
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

function DownArrow() {
  return html`
    <svg
      class="w-2.5 h-2.5 ms-2.5"
      aria-hidden="true"
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

// <svg
//             class="-mr-1 ml-2 h-5 w-5"
//             xmlns="http://www.w3.org/2000/svg"
//             viewBox="0 0 20 20"
//             fill="currentColor"
//             aria-hidden="true"
//           >
//             <path
//               fill-rule="evenodd"
//               d="M5 10a5 5 0 1110 0 5 5 0 01-10 0zm5-7a7 7 0 100 14A7 7 0 0010 3z"
//               clip-rule="evenodd"
//             />
//           </svg>

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
