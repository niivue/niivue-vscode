import { html } from 'htm/preact'
import { AppProps } from './App'
import { Signal, computed, effect, useSignal } from '@preact/signals'
import { useRef } from 'preact/hooks'
import { addImagesEvent, addOverlayEvent } from '../events'
import { SLICE_TYPE } from '@niivue/niivue'

type SubMenuEntry = {
  label: string
  onClick: () => void
}

export const Menu = (props: AppProps) => {
  const { selection, selectionActive, nvArray, nv0, sliceType, crosshair } = props
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
    'MultiPlanarTimeseries',
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

  const headerDialog = useRef<HTMLDialogElement>()
  const headerInfo = useSignal('')

  const showHeader = () => {
    headerInfo.value = nvArraySelected.value?.[0]?.volumes?.[0]?.hdr?.toFormattedString() || ''
    if (headerInfo.value && headerDialog.current) {
      headerDialog.current.showModal()
    }
  }

  const setVoxelSize1AndOrigin0 = () => {
    nvArraySelected.value.forEach((nv) => {
      nv.volumes.forEach((vol: any) => {
        vol.hdr.pixDims[1] = 1
        vol.hdr.pixDims[2] = 1
        vol.hdr.pixDims[3] = 1
        vol.hdr.qoffset_x = 0
        vol.hdr.qoffset_y = 0
        vol.hdr.qoffset_z = 0
        vol.calculateRAS()
      })
    })
    nv0.value = nvArraySelected.value[nvArraySelected.value.length - 1]
  }

  const isOverlay = computed(() => nvArraySelected.value[0]?.volumes?.length > 1)

  const overlayButtonOnClick = () => {
    const nv = nvArraySelected.value[0]
    if (!nv || nv.volumes.length == 0) {
      return
    }
    // if no overlay, add one
    // if overlay, show overlay menu
    // overlay menu includes color, min, max, opacity, hide
  }

  const addOverlay = () => {
    // if image
    addOverlayEvent(selection.value[0], 'overlay')
  }

  const removeLastVolume = () => {
    const nv = nvArraySelected.value[0]
    nv.removeVolumeByIndex(nv.volumes.length - 1)
    nv.updateGLVolume()
  }

  const setView = (view: number) => () => {
    sliceType.value = view
  }

  const setTimeSeries = () => {
    sliceType.value = SLICE_TYPE.MULTIPLANAR
    nvArraySelected.value.forEach((nv) => {
      nv.graph.autoSizeMultiplanar = true
      nv.opts.multiplanarForceRender = true
      nv.graph.normalizeValues = false
      nv.graph.opacity = 1.0
      nv.updateGLVolume()
    })
  }

  const setMultiplanar = () => {
    sliceType.value = SLICE_TYPE.MULTIPLANAR
    nvArraySelected.value.forEach((nv) => {
      nv.graph.autoSizeMultiplanar = false
      nv.updateGLVolume()
    })
  }

  const resetZoom = () => {
    nvArray.value.forEach((nv) => {
      nv.uiData.pan2Dxyzmm = [0, 0, 0, 1]
      nv.drawScene()
    })
  }

  const isMultiEcho = computed(() =>
    nvArraySelected.value.some((nv) => nv.volumes?.[0]?.getImageMetadata().nt > 1),
  )

  const toggleCrosshair = () => {
    crosshair.value = !crosshair.value
  }

  const toggleRadiologicalConvention = () => {
    nvArraySelected.value.forEach((nv) => {
      nv.opts.isRadiologicalConvention = !nv.opts.isRadiologicalConvention
      nv.drawScene()
    })
  }

  const toggleColorbar = () => {
    nvArraySelected.value.forEach((nv) => {
      nv.opts.isColorbar = !nv.opts.isColorbar
      nv.drawScene()
    })
  }

  return html`
    <div class="flex flex-wrap items-baseline gap-1">
      <${MenuButton} label="Home" onClick=${homeEvent} />
      <${MenuItem} label="Header" onClick=${showHeader}>
        <${MenuEntry} label="Set Header" onClick=${() => console.log('Not implemented yet')} />
        <${MenuEntry} label="Set Headers to 1" onClick=${setVoxelSize1AndOrigin0} />
      </${MenuItem}>
      <${MenuItem} label="Add Image" onClick=${addImagesEvent}>
        <${MenuEntry} label="File(s)" onClick=${addImagesEvent} />
        <${MenuEntry} label="URL" onClick=${() => console.log('Not implemented yet - url')} />
        <${MenuEntry}
          label="DICOM Folder"
          onClick=${() => console.log('Not implemented yet - dicom folder')}
        />
      </${MenuItem}>
      <${MenuItem} label="View" >
        <${MenuEntry} label="Axial" onClick=${setView(SLICE_TYPE.AXIAL)} />
        <${MenuEntry} label="Sagittal" onClick=${setView(SLICE_TYPE.SAGITTAL)} />
        <${MenuEntry} label="Coronal" onClick=${setView(SLICE_TYPE.CORONAL)} />
        <${MenuEntry} label="Render" onClick=${setView(SLICE_TYPE.RENDER)} />
        <${MenuEntry} label="Multiplanar + Render" onClick=${setMultiplanar} />
        ${
          isMultiEcho.value &&
          html`<${MenuEntry} label="Multiplanar + Timeseries" onClick=${setTimeSeries} />`
        }
        <hr />
        <${MenuEntry} label="Reset View" onClick=${resetZoom} />
        <${MenuEntry} label="Colorbar" onClick=${toggleColorbar} />
        <${MenuEntry} label="Radiological" onClick=${toggleRadiologicalConvention} />
        <${MenuEntry} label="Crosshair" onClick=${toggleCrosshair} />
      </${MenuItem}>
      <!-- <${MenuItem} label="Resize" menuEntries=${resizeEntries} /> -->
      <div class="border-r border-gray-700 h-4"></div>
      <${MenuItem} label="Overlay" >
        <${MenuEntry} label="Add" onClick=${addOverlay} />
        <${MenuEntry} label="Remove" onClick=${removeLastVolume} />
        <${MenuEntry} label="Color" onClick=${() => console.log('Not implemented yet - color')} />
        <${MenuEntry} label="Hide" onClick=${() => console.log('Not implemented yet - hide')} />
      </${MenuItem}>
      ${multiImage.value && html`<${ToggleButton} label="Select" state=${selectionActive} />`}
    </div>
    <dialog ref=${headerDialog}>
      <form>
        ${headerInfo.value.split('\n').map((line) => html` <p>${line}</p> `)}
        <button formmethod="dialog" value="cancel">Close</button>
      </form>
    </dialog>
  `
}

// overlay menu includes color, min, max, opacity, hide
// overlay menu is a box with a dropdown for the color, number inputs for min, max, opacity and a toggle for hide
const OverlayMenu = ({ nv }) => {
  return
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

export const MenuItem = ({ label, onClick, children }) => {
  const isOpen = useSignal(false)
  const selectedElement = useSignal(0)
  children.forEach((child, index) => {
    if (child.type == MenuEntry) {
      child.props.isOpen = isOpen
    }
  })

  return html`
    <div class="relative group">
      <button class="group-hover:bg-gray-700 px-2 rounded-l-md h-6 align-middle" onClick=${onClick}>
        ${label}
      </button>
      <button
        class="hover:bg-gray-700 px-2 rounded-r-md h-6 align-middle"
        onClick=${() => (isOpen.value = !isOpen.value)}
      >
        <${DownArrow} />
      </button>
      <div class="absolute cursor-pointer left-0 z-50">${isOpen.value && children}</div>
    </div>
  `
}

export const MenuEntry = ({ label, onClick, isOpen }) => {
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
