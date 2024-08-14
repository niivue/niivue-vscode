import { html } from 'htm/preact'
import { Signal, computed, effect, useSignal } from '@preact/signals'
import { SLICE_TYPE } from '@niivue/niivue'
import { AppProps, SelectionMode } from './App'
import { ScalingBox } from './ScalingBox'
import { getMetadataString, getNumberOfPoints } from '../utility'
import {
  addDcmFolderEvent,
  addImagesEvent,
  addOverlayEvent,
  openImageFromURL,
  ExtendedNiivue,
} from '../events'
import {
  HeaderDialog,
  ImageSelect,
  MenuButton,
  MenuToggle,
  MenuEntry,
  MenuItem,
  ToggleEntry,
  toggle,
} from './MenuElements'
import { HeaderBox } from './HeaderBox'

export const Menu = (props: AppProps) => {
  const { selection, selectionMode, nvArray, sliceType, hideUI } = props
  const isVscode = typeof vscode === 'object'

  // State
  const headerDialog = useSignal(false)
  const zoomDragMode = useSignal(false)
  const selectedOverlayNumber = useSignal(0)
  const overlayMenu = useSignal(false)
  const setHeaderMenu = useSignal(false)
  const interpolation = useSignal(true)
  const crosshair = useSignal(true)
  const radiologicalConvention = useSignal(false)
  const colorbar = useSignal(false)
  const selectionActive = useSignal(false)
  const selectMultiple = useSignal(false)

  // Computed
  const isOverlay = computed(() => nvArraySelected.value[0]?.volumes?.length > 1)
  const multipleVolumes = computed(() => nvArray.value.length > 1)
  const nvArraySelected = computed(() =>
    selectionMode.value != SelectionMode.NONE && selection.value.length > 0
      ? nvArray.value.filter((_, i) => selection.value.includes(i))
      : nvArray.value,
  )
  const isMultiEcho = computed(() =>
    nvArraySelected.value.some((nv) => nv.volumes?.[0]?.getImageMetadata().nt > 1),
  )
  const isVolume = computed(() => nvArraySelected.value[0]?.volumes?.length > 0)
  const isMesh = computed(() => nvArraySelected.value[0]?.meshes?.length > 0)
  const isVolumeOrMesh = computed(() => isVolume.value || isMesh.value)
  const nOverlays = computed(() => {
    const nv = nvArraySelected.value[0]
    if (isVolume.value) {
      return nv.volumes.length - 1
    } else if (isMesh.value) {
      return nv.meshes[0].layers.length
    } else {
      return 0
    }
  })

  // Effects that occur when state or computed changes
  effect(() => applySelectionModeChange(selectionMode, selectionActive, selectMultiple))
  effect(() => ensureValidSelection(selection, nvArray, selectionMode))
  effect(() => applyInterpolation(nvArray, interpolation))
  effect(() => applyCrosshairWidth(nvArray, crosshair))
  effect(() => applyRadiologicalConvention(nvArray, radiologicalConvention))
  effect(() => applyColorbar(nvArray, colorbar))
  effect(() => applyDragMode(nvArray, zoomDragMode))

  // Menu Click events
  const homeEvent = () => {
    const url = new URL(location.href)
    location.href = url.origin + url.pathname
    location.reload()
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

  const overlayButtonOnClick = () => {
    if (isVolume.value)
      if (!isOverlay.value) addOverlay()
      else replaceLastVolume()
    else addMeshOverlay()
  }

  const addOverlay = () => {
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
      nv.scene.pan2Dxyzmm = [0, 0, 0, 1]
      nv.drawScene()
    })
  }

  const selectAll = () => {
    selectMultiple.value = true
    selection.value = nvArray.value.map((_, i) => i)
  }

  const openColorScale = (overlayNumber: number) => () => {
    if (isVolume.value) {
      selectedOverlayNumber.value = overlayNumber
    } else if (isMesh.value) {
      selectedOverlayNumber.value = overlayNumber - 1
    } else {
      selectedOverlayNumber.value = 0
    }
    overlayMenu.value = true
  }
  const openColorScaleLastOverlay = () => {
    selectedOverlayNumber.value = nOverlays.value - (isMesh.value ? 1 : 0)
    overlayMenu.value = true
  }

  return html`
    <div class="flex flex-wrap items-baseline gap-2">
      ${!isVscode && html`<${MenuButton} label="Home" onClick=${homeEvent} />`}
      <${MenuItem} label="Add Image" onClick=${addImagesEvent}>
        <${MenuEntry} label="File(s)" onClick=${addImagesEvent} />
        <!-- <${MenuEntry} label="URL" onClick=${() =>
    console.log('Not implemented yet - url')} /> -->
        <${MenuEntry}
          label="DICOM Folder"
          onClick=${addDcmFolderEvent}
        />
        <${MenuEntry} label="Example Image" onClick=${() =>
    openImageFromURL('https://niivue.github.io/niivue-demo-images/mni152.nii.gz')} />
      </${MenuItem}>
      <${MenuItem} label="View" onClick=${resetZoom} >
        <${MenuEntry} label="Axial" onClick=${() => (sliceType.value = SLICE_TYPE.AXIAL)} />
        <${MenuEntry} label="Sagittal" onClick=${() => (sliceType.value = SLICE_TYPE.SAGITTAL)} />
        <${MenuEntry} label="Coronal" onClick=${() => (sliceType.value = SLICE_TYPE.CORONAL)} />
        <${MenuEntry} label="Render" onClick=${() => (sliceType.value = SLICE_TYPE.RENDER)} />
        <${MenuEntry} label="Multiplanar + Render" onClick=${setMultiplanar} />
        <${MenuEntry} label="Multiplanar + Timeseries" onClick=${setTimeSeries} visible=${isMultiEcho} />
        <hr />
        <${MenuEntry} label="Show All" onClick=${() => (hideUI.value = 3)} />
        <${MenuEntry} label="Hide UI" onClick=${() => (hideUI.value = 2)} />
        <${MenuEntry} label="Hide All" onClick=${() => (hideUI.value = 0)} />
        <hr />
        <${MenuEntry} label="Reset View" onClick=${resetZoom} />
        <hr />
        <${ToggleEntry} label="Interpolation" state=${interpolation} />
        <${ToggleEntry} label="Colorbar" state=${colorbar} />
        <${ToggleEntry} label="Radiological" state=${radiologicalConvention} />
        <${ToggleEntry} label="Crosshair" state=${crosshair} />
      </${MenuItem}>
      <${MenuToggle} label="Zoom" state=${zoomDragMode} />
      <${MenuItem} label="ColorScale" visible=${isVolumeOrMesh} onClick=${openColorScaleLastOverlay} >
        <${MenuEntry} label="Volume" onClick=${openColorScale(0)} visible=${isVolume} />
        ${Array.from(
          { length: nOverlays.value },
          (_, i) =>
            html` <${MenuEntry} label="Overlay ${i + 1}" onClick=${openColorScale(i + 1)} /> `,
        )}
      </${MenuItem}>
      <${MenuItem} label="Overlay" onClick=${overlayButtonOnClick} visible=${isVolumeOrMesh}>
        <${MenuEntry} label="Add" onClick=${addOverlay} visible=${isVolume} />
        <${MenuEntry} label="Add" onClick=${addMeshOverlay} visible=${isMesh} />
        <${MenuEntry} label="Curvature" onClick=${addCurvature} visible=${isMesh} />
        <${MenuEntry} label="ImageOverlay" onClick=${addOverlay} visible=${isMesh} />
        <${MenuEntry} label="Replace" onClick=${replaceLastVolume} visible=${isOverlay} />
        <${MenuEntry} label="Remove" onClick=${removeLastVolume} visible=${isOverlay} />
      </${MenuItem}>
      <${MenuItem} label="Header" onClick=${toggle(headerDialog)} visible=${isVolume} >
        <!-- <${MenuEntry} label="Set Header" onClick=${() =>
    console.log('Not implemented yet')} /> -->
        <${MenuEntry} label="Set Headers to 1" onClick=${setVoxelSize1AndOrigin0} />
        <${MenuEntry} label="Set Header" onClick=${toggle(setHeaderMenu)} />
      </${MenuItem}>
      <${ImageSelect} label="Select" state=${selectionActive} visible=${multipleVolumes}>
        <${ToggleEntry} label="Multiple" state=${selectMultiple} />
        <${MenuEntry} label="Select All" onClick=${selectAll} />
      </${ImageSelect}>
    </div>
    ${isMesh.value && html`<p class="pl-2">${getNumberOfPoints(nvArraySelected.value[0])}</p>`}
    ${isVolume.value && html`<p class="pl-2">${getMetadataString(nvArraySelected.value[0])}</p>`}
    <${ScalingBox}
        selectedOverlayNumber=${selectedOverlayNumber}
        overlayMenu=${overlayMenu}
        nvArraySelected=${nvArraySelected}
        visible=${overlayMenu}
      />
    <${HeaderBox}
      nvArraySelected=${nvArraySelected}
      nvArray=${nvArray}
      visible=${setHeaderMenu}
      />
    <${HeaderDialog} nvArraySelected=${nvArraySelected} isOpen=${headerDialog} />
  `
}

function applySelectionModeChange(
  selectionMode: Signal<SelectionMode>,
  selectionActive: Signal<boolean>,
  selectMultiple: Signal<boolean>,
) {
  if (!selectionActive.value) selectionMode.value = SelectionMode.NONE
  else if (selectMultiple.value) selectionMode.value = SelectionMode.MULTIPLE
  else selectionMode.value = SelectionMode.SINGLE
}

function ensureValidSelection(
  selection: Signal<number[]>,
  nvArray: Signal<ExtendedNiivue[]>,
  selectionMode: Signal<SelectionMode>,
) {
  if (nvArray.value.length == 0) return
  else if (selectionMode.value == SelectionMode.SINGLE && selection.value.length != 1)
    selection.value = [0]
  else if (
    (selectionMode.value == SelectionMode.MULTIPLE || selectionMode.value == SelectionMode.NONE) &&
    selection.value.length == 0
  ) {
    selection.value = nvArray.value.map((_, i) => i)
  }
}

function applyInterpolation(nvArray: Signal<ExtendedNiivue[]>, interpolation: Signal<boolean>) {
  nvArray.value.forEach((nv: ExtendedNiivue) => {
    if (nv.opts.isNearestInterpolation != !interpolation.value) {
      nv.setInterpolation(!interpolation.value)
      nv.drawScene()
    }
  })
}

function applyCrosshairWidth(nvArray: Signal<ExtendedNiivue[]>, crosshair: Signal<boolean>) {
  nvArray.value.forEach((nv: ExtendedNiivue) => {
    if (nv.opts.crosshairWidth != Number(crosshair.value)) {
      try {
        nv.setCrosshairWidth(Number(crosshair.value))
      } catch (e) {
        console.log(e)
      }
      nv.drawScene()
    }
  })
}

function applyRadiologicalConvention(
  nvArray: Signal<ExtendedNiivue[]>,
  radiologicalConvention: Signal<boolean>,
) {
  nvArray.value.forEach((nv: ExtendedNiivue) => {
    if (nv.getRadiologicalConvention() != radiologicalConvention.value) {
      nv.setRadiologicalConvention(radiologicalConvention.value)
      nv.drawScene()
    }
  })
}

function applyColorbar(nvArray: Signal<ExtendedNiivue[]>, colorbar: Signal<boolean>) {
  nvArray.value.forEach((nv: ExtendedNiivue) => {
    if (nv.opts.isColorbar != colorbar.value) {
      nv.opts.isColorbar = colorbar.value
      nv.drawScene()
    }
  })
}

function applyDragMode(nvArray: Signal<ExtendedNiivue[]>, zoomDragMode: Signal<boolean>) {
  nvArray.value.forEach((nv: ExtendedNiivue) => {
    if (zoomDragMode.value) nv.opts.dragMode = nv.dragModes.slicer3D
    else nv.opts.dragMode = nv.dragModes.contrast
  })
}
