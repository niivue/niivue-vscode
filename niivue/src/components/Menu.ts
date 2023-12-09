import { html } from 'htm/preact'
import { AppProps } from './App'
import { Signal, computed, effect, useSignal } from '@preact/signals'
import { useRef } from 'preact/hooks'
import { addImagesEvent, addOverlayEvent } from '../events'
import { SLICE_TYPE } from '@niivue/niivue'
import { Scaling } from './Scaling'
import { handleOpacity, handleOverlayColormap } from './OverlayOptions'

export const Menu = (props: AppProps) => {
  const { selection, selectionMode, nvArray, sliceType, crosshair, hideUI, interpolation } = props
  const nvArraySelected = computed(() =>
    selectionMode.value > 0 && selection.value.length > 0
      ? nvArray.value.filter((_, i) => selection.value.includes(i))
      : nvArray.value,
  )
  const multiImage = computed(() => nvArray.value.length > 1)

  effect(() => {
    if (selection.value.length == 0 && nvArray.value.length > 0) {
      if (selectionMode.value == 1) {
        selection.value = [0]
      } else {
        selection.value = nvArray.value.map((_, i) => i)
      }
    }
  })

  const homeEvent = () => {
    const url = new URL(location.href)
    location.href = url.origin + url.pathname
    location.reload()
  }

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
    nvArray.value = [...nvArray.value]
  }

  const isOverlay = computed(() => nvArraySelected.value[0]?.volumes?.length > 1)

  // const overlayButtonOnClick = () => {
  //   const nv = nvArraySelected.value[0]
  //   if (!nv || nv.volumes.length == 0) {
  //     return
  //   }
  //   // if no overlay, add one
  //   // if overlay, show overlay menu
  //   // overlay menu includes color, min, max, opacity, hide
  // }

  const addOverlay = () => {
    // if image
    addOverlayEvent(selection.value[0], 'overlay')
  }

  const addCurvature = () => {
    addOverlayEvent(selection.value[0], 'addMeshCurvature')
  }

  const addMeshOverlay = () => {
    addOverlayEvent(selection.value[0], 'addMeshOverlay')
  }

  const removeLastVolume = () => {
    const nv = nvArraySelected.value[0]
    nv.removeVolumeByIndex(nv.volumes.length - 1)
    nv.updateGLVolume()
    nvArray.value = [...nvArray.value]
  }

  const replaceLastVolume = () => {
    if (isVolume.value) {
      const nv = nvArraySelected.value[0]
      nv.removeVolumeByIndex(nv.volumes.length - 1)
      addOverlayEvent(selection.value[0], 'overlay')
    } else {
      addOverlayEvent(selection.value[0], 'replaceMeshOverlay')
    }
  }

  const setView = (view: number) => () => {
    sliceType.value = view
  }

  const setTimeSeries = () => {
    crosshair.value = true
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

  const openImage = (uri: string) => {
    window.postMessage({
      type: 'addImage',
      body: {
        data: '',
        uri,
      },
    })
  }

  const isVolume = computed(() => nvArraySelected.value[0]?.volumes?.length > 0)
  const isMesh = computed(() => nvArraySelected.value[0]?.meshes?.length > 0)
  const isVolumeOrMesh = computed(() => isVolume.value || isMesh.value)

  const selectAll = () => {
    selection.value = nvArray.value.map((_, i) => i)
  }

  const nOverlays = computed(() => nvArraySelected.value[0]?.volumes?.length - 1 || 0)
  const selectedOverlayNumber = useSignal(0)
  const overlayMenu = useSignal(false)

  return html`
    <div class="flex flex-wrap items-baseline gap-2">
      <${MenuButton} label="Home" onClick=${homeEvent} />      
      <${MenuItem} label="Add Image" onClick=${addImagesEvent}>
        <${MenuEntry} label="File(s)" onClick=${addImagesEvent} />
        <${MenuEntry} label="URL" onClick=${() => console.log('Not implemented yet - url')} />
        <${MenuEntry}
          label="DICOM Folder"
          onClick=${() => console.log('Not implemented yet - dicom folder')}
        />
        <${MenuEntry} label="Example Image" onClick=${() =>
    openImage('https://niivue.github.io/niivue-demo-images/mni152.nii.gz')} />
      </${MenuItem}>
      <${MenuItem} label="View" >
        <${MenuEntry} label="Axial" onClick=${setView(SLICE_TYPE.AXIAL)} />
        <${MenuEntry} label="Sagittal" onClick=${setView(SLICE_TYPE.SAGITTAL)} />
        <${MenuEntry} label="Coronal" onClick=${setView(SLICE_TYPE.CORONAL)} />
        <${MenuEntry} label="Render" onClick=${setView(SLICE_TYPE.RENDER)} />
        <${MenuEntry} label="Multiplanar + Render" onClick=${setMultiplanar} />
        <${MenuEntry} label="Multiplanar + Timeseries" onClick=${setTimeSeries} visible=${isMultiEcho} />
        <hr />
        <${MenuEntry} label="Show All" onClick=${() => (hideUI.value = 3)} />
        <${MenuEntry} label="Hide UI" onClick=${() => (hideUI.value = 2)} />
        <${MenuEntry} label="Hide All" onClick=${() => (hideUI.value = 0)} />
        <hr />
        <${MenuEntry} label="Interpolation" onClick=${() =>
    (interpolation.value = !interpolation.value)} />
        <${MenuEntry} label="Reset View" onClick=${resetZoom} />
        <${MenuEntry} label="Colorbar" onClick=${toggleColorbar} />
        <${MenuEntry} label="Radiological" onClick=${toggleRadiologicalConvention} />
        <${MenuEntry} label="Crosshair" onClick=${toggleCrosshair} />
      </${MenuItem}>
      <${MenuItem} label="ColorScale" visible=${isVolumeOrMesh} >
        <${MenuEntry} label="Volume" onClick=${() => {
    selectedOverlayNumber.value = 0
    overlayMenu.value = true
  }} />
        ${Array.from(
          { length: nOverlays.value },
          (_, i) => html`
            <${MenuEntry}
              label="Overlay ${i + 1}"
              onClick=${() => {
                selectedOverlayNumber.value = i + 1
                overlayMenu.value = true
              }}
            />
          `,
        )}        
      </${MenuItem}>      
      <${MenuItem} label="Overlay" onClick=${addOverlay} visible=${isVolumeOrMesh}>
        <${MenuEntry} label="Add" onClick=${addOverlay} visible=${isVolume} />
        <${MenuEntry} label="Add" onClick=${addMeshOverlay} visible=${isMesh} />
        <${MenuEntry} label="Curvature" onClick=${addCurvature} visible=${isMesh} />
        <${MenuEntry} label="ImageOverlay" onClick=${addOverlay} visible=${isMesh} />
        <${MenuEntry} label="Replace" onClick=${replaceLastVolume} visible=${isOverlay} />
        <${MenuEntry} label="Remove" onClick=${removeLastVolume} visible=${isOverlay} />
      </${MenuItem}>
      <${MenuItem} label="Header" onClick=${showHeader} visible=${isVolume} >
        <${MenuEntry} label="Set Header" onClick=${() => console.log('Not implemented yet')} />
        <${MenuEntry} label="Set Headers to 1" onClick=${setVoxelSize1AndOrigin0} />
      </${MenuItem}>
      <${ImageSelect} label="Select" state=${selectionMode} visible=${multiImage}>
        <${MenuEntry} label="Select All" onClick=${selectAll} />
      </${ImageSelect}>
    </div>
    ${isVolume.value && html`<p class="pl-2">${getMetadataString(nvArraySelected.value[0])}</p>`}
    <${ScalingBox}
        selectedOverlayNumber=${selectedOverlayNumber}
        overlayMenu=${overlayMenu}
        nvArraySelected=${nvArraySelected}
        visible=${overlayMenu}
      />
    <dialog ref=${headerDialog}>
      <form>
        ${headerInfo.value.split('\n').map((line) => html` <p>${line}</p> `)}
        <button formmethod="dialog" value="cancel">Close</button>
      </form>
    </dialog>
  `
}

const ScalingBox = (props: any) => {
  const { nvArraySelected, selectedOverlayNumber, overlayMenu, visible } = props
  if (visible && !visible.value) return html``

  const setScaling = (val: ScalingOpts) => {
    nvArraySelected.value.forEach((nv: Niivue) => {
      nv.volumes[0].cal_min = val.min
      nv.volumes[0].cal_max = val.max
      nv.updateGLVolume()
    })
  }
  const isVolume = computed(() => nvArraySelected.value[0]?.volumes?.length > 0)
  const colormaps = computed(() =>
    isVolume.value
      ? ['symmetric', ...nvArraySelected.value[0].colormaps()]
      : ['ge_color', 'hsv', 'symmetric', 'warm'],
  )
  const handleColormap = (e: any) => {
    const colormap = e.target.value
    nvArraySelected.value.forEach((nv: Niivue) => {
      handleOverlayColormap(nv, selectedOverlayNumber.value, colormap)
    })
  }

  const selectedOverlay = computed(
    () => nvArraySelected.value[0]?.volumes?.[selectedOverlayNumber.value],
  )

  const changeOpacity = (e: any) => {
    const opacity = e.target.value
    nvArraySelected.value.forEach((nv: Niivue) => {
      handleOpacity(nv, selectedOverlayNumber.value, opacity)
    })
  }

  return html`
    <div class="absolute left-8 top-8 bg-gray-500 rounded-md z-50 space-y-1 space-x-1 p-1">
      <${Scaling} setScaling=${setScaling} init=${selectedOverlay.value} />
      <select
        class="bg-gray-600 w-24 border-2 border-gray-600 rounded-md"
        onchange=${handleColormap}
        value=${selectedOverlay.value.colormap}
      >
        ${colormaps.value.map((c) => html`<option value=${c}>${c}</option>`)}
      </select>
      <input
        class="bg-gray-600 w-16 border-2 border-gray-600 rounded-md"
        type="number"
        value=${selectedOverlay.value.opacity}
        onchange=${changeOpacity}
        min="0"
        max="1"
        step="0.1"
      />
      <button
        class="bg-gray-600 border-2 border-gray-600 rounded-md w-16 opacity-50 cursor-not-allowed"
        onclick=${() => console.log('Not implemented yet')}
      >
        Hide
      </button>
      <br />
      <button
        class="bg-gray-600 border-2 border-gray-600 rounded-md w-16"
        onclick=${() => (overlayMenu.value = false)}
      >
        Close
      </button>
    </div>
  `
}

export interface ScalingOpts {
  isManual: boolean
  min: number
  max: number
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

// It seems that one child is given directly while multiple children are given as an array
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

// maybe selection menu with arrow and option to keep selection?
// select single and multiple options
export const ImageSelect = ({ label, state, children, visible }: any) => {
  if (visible && !visible.value) return html``
  const isOpen = useSignal(false)
  setChildren(children, isOpen)

  return html`
    <div class="relative group">
      <button
        class="group-hover:bg-gray-700 px-2 rounded-l-md h-6 align-middle ${state.value &&
        'bg-gray-700'}"
        onClick=${() => (state.value = !state.value)}
      >
        ${label}
      </button>
      <button
        class="hover:bg-gray-700 pr-2 rounded-r-md h-6 align-middle"
        onClick=${() => (isOpen.value = !isOpen.value)}
      >
        <${DownArrow} />
      </button>
      <div class="absolute cursor-pointer left-0 z-50">${isOpen.value && children}</div>
    </div>
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
        onClick=${() => (isOpen.value = !isOpen.value)}
      >
        <${DownArrow} />
      </button>
      <div class="absolute cursor-pointer left-0 z-50 min-w-full">${isOpen.value && children}</div>
    </div>
  `
}

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

export const MenuItemSelect = ({ menuEntries }: any) => {
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
            (item: any, index: number) => html`
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
}

export function getMetadataString(nv: Niivue) {
  const meta = nv?.volumes?.[0]?.getImageMetadata()
  if (!meta || !meta.nx) {
    return ''
  }
  const matrixString = 'matrix size: ' + meta.nx + ' x ' + meta.ny + ' x ' + meta.nz
  const voxelString =
    'voxelsize: ' +
    meta.dx.toPrecision(2) +
    ' x ' +
    meta.dy.toPrecision(2) +
    ' x ' +
    meta.dz.toPrecision(2)
  const timeString = meta.nt > 1 ? ', timepoints: ' + meta.nt : ''
  return matrixString + ', ' + voxelString + timeString
}
