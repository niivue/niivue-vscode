import { SLICE_TYPE } from '@niivue/niivue'
import { Signal, computed, effect, useSignal } from '@preact/signals'
import { NIIVUE_CORE_SHORTCUTS, UI_SHORTCUTS, formatShortcut } from '../constants/keyboardShortcuts'
import {
    ExtendedNiivue,
    addDcmFolderEvent,
    addImagesEvent,
    addOverlayEvent,
    openImageFromURL,
} from '../events'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { getMetadataString, getNumberOfPoints } from '../utility'
import { AppProps, SelectionMode } from './AppProps'
import { HeaderBox } from './HeaderBox'
import {
    HeaderDialog,
    ImageSelect,
    MenuButton,
    MenuEntry,
    MenuItem,
    MenuToggle,
    ToggleEntry,
    toggle,
} from './MenuElements'
import { ScalingBox } from './ScalingBox'

export const Menu = (props: AppProps) => {
  const { selection, selectionMode, nvArray, sliceType, hideUI, settings } = props
  const isVscode = typeof (globalThis as any).vscode === 'object'

  // State
  const headerDialog = useSignal(false)
  const selectedOverlayNumber = useSignal(0)
  const overlayMenu = useSignal(false)
  const setHeaderMenu = useSignal(false)
  const interpolation = useSignal(settings.value.interpolation)
  const crosshair = useSignal(settings.value.showCrosshairs)
  const radiologicalConvention = useSignal(settings.value.radiologicalConvention)
  const colorbar = useSignal(settings.value.colorbar)
  const zoomDragMode = useSignal(settings.value.zoomDragMode)
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

  const has4D = computed(() =>
    nvArraySelected.value.some((nv) => (nv.volumes?.[0]?.nFrame4D ?? 0) > 1)
  )

  const displayInfo = computed(() => {
    if (isVolume.value) {
      return getMetadataString(nvArraySelected.value[0])
    } else if (isMesh.value) {
      return getNumberOfPoints(nvArraySelected.value[0])
    } else {
      return 'Metadata Info' // non-breaking space for empty line
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

  // Sync settings global value to local signals (e.g. for Streamlit)
  effect(() => {
    interpolation.value = settings.value.interpolation
    crosshair.value = settings.value.showCrosshairs
    radiologicalConvention.value = settings.value.radiologicalConvention
    colorbar.value = settings.value.colorbar
    zoomDragMode.value = settings.value.zoomDragMode
  })

  // Sync local signal changes back to global settings
  effect(() => {
    if (
      settings.value.interpolation !== interpolation.value ||
      settings.value.showCrosshairs !== crosshair.value ||
      settings.value.radiologicalConvention !== radiologicalConvention.value ||
      settings.value.colorbar !== colorbar.value ||
      settings.value.zoomDragMode !== zoomDragMode.value
    ) {
      settings.value = {
        ...settings.value,
        interpolation: interpolation.value,
        showCrosshairs: crosshair.value,
        radiologicalConvention: radiologicalConvention.value,
        colorbar: colorbar.value,
        zoomDragMode: zoomDragMode.value,
      }
    }
  })

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

  const getTargetIndex = () => {
    // If selectionMode is NONE or selection is empty, default to last canvas
    if (selectionMode.value === SelectionMode.NONE || selection.value.length === 0) {
      return nvArray.value.length - 1
    }
    // Otherwise use the last selected canvas
    return selection.value[selection.value.length - 1]
  }

  const addOverlay = () => {
    addOverlayEvent(getTargetIndex(), 'overlay')
  }

  const addMeshOverlay = () => {
    addOverlayEvent(getTargetIndex(), 'addMeshOverlay')
  }

  const addCurvature = () => {
    addOverlayEvent(getTargetIndex(), 'addMeshCurvature')
  }

  const replaceLastVolume = () => {
    if (isVolume.value) {
      const nv = nvArraySelected.value[nvArraySelected.value.length - 1]
      nv.removeVolumeByIndex(nv.volumes.length - 1)
      addOverlayEvent(getTargetIndex(), 'overlay')
    } else {
      addOverlayEvent(getTargetIndex(), 'replaceMeshOverlay')
    }
  }

  const removeLastVolume = () => {
    const nv = nvArraySelected.value[0]
    nv.removeVolumeByIndex(nv.volumes.length - 1)
    nv.updateGLVolume()
    nvArray.value = [...nvArray.value]
  }

  const resetZoom = () => {
    nvArray.value.forEach((nv) => {
      nv.scene.pan2Dxyzmm = [0, 0, 0, 1]
      nv.drawScene()
    })
  }

  const setMultiplanar = () => {
    sliceType.value = SLICE_TYPE.MULTIPLANAR
    nvArraySelected.value.forEach((nv) => {
      nv.graph.autoSizeMultiplanar = false
      nv.updateGLVolume()
    })
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

  const selectAll = () => {
    selectMultiple.value = true
    selection.value = nvArray.value.map((_, i) => i)
  }

  const saveSettings = () => {
    const currentSettings = {
      interpolation: interpolation.value,
      showCrosshairs: crosshair.value,
      radiologicalConvention: radiologicalConvention.value,
      colorbar: colorbar.value,
      zoomDragMode: zoomDragMode.value,
    }
    localStorage.setItem('userSettings', JSON.stringify(currentSettings))
    alert('Settings saved!')
  }

  const cycleUIVisibility = () => {
    if (hideUI.value === 3) hideUI.value = 2
    else if (hideUI.value === 2) hideUI.value = 0
    else hideUI.value = 3
  }

  const cycleViewMode = () => {
    sliceType.value = (sliceType.value + 1) % 5
  }

  // temporary fix to allow cycling via menu
  const cycleClipPlane = () => {
    nvArraySelected.value.forEach((nv: any) => {
      nv.currentClipPlaneIndex = ((nv.currentClipPlaneIndex || 0) + 1) % 7
      let p = [2, 0, 0]
      switch (nv.currentClipPlaneIndex) {
        case 0:
          p = [2, 0, 0]
          break
        case 1:
          p = [0, 270, 0]
          break
        case 2:
          p = [0, 90, 0]
          break
        case 3:
          p = [0, 0, 0]
          break
        case 4:
          p = [0, 180, 0]
          break
        case 5:
          p = [0, 0, -90]
          break
        case 6:
          p = [0, 0, 90]
          break
      }
      nv.scene.clipPlaneDepthAziElev = p
      nv.setClipPlane(p)
      nv.drawScene()
    })
  }

  const volumeNext = () => {
    nvArraySelected.value.forEach((nv) => {
      const volume = nv.volumes[0]
      if (volume && volume.nFrame4D && volume.nFrame4D > 1) {
        const nextFrame = Math.min(volume.nFrame4D - 1, volume.frame4D + 1)
        if (nextFrame !== volume.frame4D) {
          // cast to any because ExtendedNiivue/Niivue signature might vary across versions
          ;(nv as any).setFrame4D(volume, nextFrame)
        }
      } else if (nv.volumes.length > 1) {
        const currentVolIdx = (nv as any).volIdx ?? 0
        const nextVolIdx = Math.min(nv.volumes.length - 1, currentVolIdx + 1)
        if (nextVolIdx !== currentVolIdx) {
          nv.setVolume(nv.volumes[nextVolIdx])
        }
      }
    })
  }

  const volumePrev = () => {
    nvArraySelected.value.forEach((nv) => {
      const volume = nv.volumes[0]
      if (volume && volume.nFrame4D && volume.nFrame4D > 1) {
        const prevFrame = Math.max(0, volume.frame4D - 1)
        if (prevFrame !== volume.frame4D) {
          ;(nv as any).setFrame4D(volume, prevFrame)
        }
      } else if (nv.volumes.length > 1) {
        const currentVolIdx = (nv as any).volIdx ?? 0
        const prevVolIdx = Math.max(0, currentVolIdx - 1)
        if (prevVolIdx !== currentVolIdx) {
          nv.setVolume(nv.volumes[prevVolIdx])
        }
      }
    })
  }
  
  const crosshairSuperior = () => {
    nvArraySelected.value.forEach((nv) => {
      nv.moveCrosshairInVox(0, 0, 1)
      nv.drawScene()
    })
  }

  const crosshairInferior = () => {
    nvArraySelected.value.forEach((nv) => {
      nv.moveCrosshairInVox(0, 0, -1)
      nv.drawScene()
    })
  }

  const crosshairRight = () => {
    nvArraySelected.value.forEach((nv) => {
      nv.moveCrosshairInVox(1, 0, 0)
      nv.drawScene()
    })
  }

  const crosshairLeft = () => {
    nvArraySelected.value.forEach((nv) => {
      nv.moveCrosshairInVox(-1, 0, 0)
      nv.drawScene()
    })
  }

  const crosshairAnterior = () => {
    nvArraySelected.value.forEach((nv) => {
      nv.moveCrosshairInVox(0, 1, 0)
      nv.drawScene()
    })
  }

  const crosshairPosterior = () => {
    nvArraySelected.value.forEach((nv) => {
      nv.moveCrosshairInVox(0, -1, 0)
      nv.drawScene()
    })
  }

  // Signal sync handlers
  const toggleInterpolation = () => {
    interpolation.value = !interpolation.value
    settings.value = { ...settings.value, interpolation: interpolation.value }
  }

  const toggleColorbar = () => {
    colorbar.value = !colorbar.value
    settings.value = { ...settings.value, colorbar: colorbar.value }
  }

  const toggleRadiological = () => {
    radiologicalConvention.value = !radiologicalConvention.value
    settings.value = {
      ...settings.value,
      radiologicalConvention: radiologicalConvention.value,
    }
  }

  const toggleCrosshair = () => {
    crosshair.value = !crosshair.value
    settings.value = { ...settings.value, showCrosshairs: crosshair.value }
  }

  const toggleZoomDragMode = () => {
    zoomDragMode.value = !zoomDragMode.value
    settings.value = { ...settings.value, zoomDragMode: zoomDragMode.value }
  }

  // No-op function for informational menu entries
  const noOp = () => {}

  // Setup keyboard shortcuts handlers
  const handlers = {
    onViewAxial: () => (sliceType.value = SLICE_TYPE.AXIAL),
    onViewSagittal: () => (sliceType.value = SLICE_TYPE.SAGITTAL),
    onViewCoronal: () => (sliceType.value = SLICE_TYPE.CORONAL),
    onViewRender: () => (sliceType.value = SLICE_TYPE.RENDER),
    onViewMultiplanar: setMultiplanar,
    onViewMultiplanarTimeseries: setTimeSeries,
    onCycleViewMode: cycleViewMode,
    onCycleClipPlane: cycleClipPlane,
    onVolumeNext: volumeNext,
    onVolumePrev: volumePrev,
    onResetView: resetZoom,
    onToggleInterpolation: toggleInterpolation,
    onToggleColorbar: toggleColorbar,
    onToggleRadiological: toggleRadiological,
    onToggleCrosshair: toggleCrosshair,
    onToggleZoomMode: toggleZoomDragMode,
    onAddImage: addImagesEvent,
    onAddOverlay: overlayButtonOnClick,
    onColorscale: openColorScaleLastOverlay,
    onHideUI: cycleUIVisibility,
    onShowHeader: toggle(headerDialog),
    onCrosshairSuperior: crosshairSuperior,
    onCrosshairInferior: crosshairInferior,
  }

  useKeyboardShortcuts(handlers)

  return (
    <>
      <div
        className="flex flex-wrap items-baseline gap-2"
      >
        {!isVscode && settings.value.menuItems?.home && (
          <MenuButton label="Home" onClick={homeEvent} />
        )}
        {settings.value.menuItems?.addImage && (
          <MenuItem
            label="Add Image"
            onClick={addImagesEvent}
            shortcut={formatShortcut(UI_SHORTCUTS.ADD_IMAGE)}
          >
            <MenuEntry label="File(s)" onClick={addImagesEvent} />
            <MenuEntry label="DICOM Folder" onClick={addDcmFolderEvent} />
            <MenuEntry
              label="Example Image"
              onClick={() =>
                openImageFromURL('https://niivue.github.io/niivue-demo-images/mni152.nii.gz')
              }
            />
          </MenuItem>
        )}
        {settings.value.menuItems?.view && (
          <MenuItem
            label="View"
            onClick={resetZoom}
            shortcut={formatShortcut(UI_SHORTCUTS.RESET_VIEW)}
          >
            <MenuEntry
              label="Axial"
              onClick={() => (sliceType.value = SLICE_TYPE.AXIAL)}
              shortcut={formatShortcut(UI_SHORTCUTS.VIEW_AXIAL)}
            />
            <MenuEntry
              label="Sagittal"
              onClick={() => (sliceType.value = SLICE_TYPE.SAGITTAL)}
              shortcut={formatShortcut(UI_SHORTCUTS.VIEW_SAGITTAL)}
            />
            <MenuEntry
              label="Coronal"
              onClick={() => (sliceType.value = SLICE_TYPE.CORONAL)}
              shortcut={formatShortcut(UI_SHORTCUTS.VIEW_CORONAL)}
            />
            <MenuEntry
              label="Render"
              onClick={() => (sliceType.value = SLICE_TYPE.RENDER)}
              shortcut={formatShortcut(UI_SHORTCUTS.VIEW_RENDER)}
            />
            <MenuEntry
              label="Multiplanar + Render"
              onClick={setMultiplanar}
              shortcut={formatShortcut(UI_SHORTCUTS.VIEW_MULTIPLANAR)}
            />
            <MenuEntry
              label="Multiplanar + Timeseries"
              onClick={setTimeSeries}
              shortcut={formatShortcut(UI_SHORTCUTS.VIEW_MULTIPLANAR_TIMESERIES)}
              visible={isMultiEcho}
            />
            <hr />
            <MenuEntry
              label="Cycle View Mode"
              onClick={cycleViewMode}
              shortcut={formatShortcut(NIIVUE_CORE_SHORTCUTS.CYCLE_VIEW_MODE)}
              keepOpen={true}
            />
            <MenuEntry
              label="Cycle Clip Plane (3D)"
              onClick={cycleClipPlane}
              shortcut={formatShortcut(NIIVUE_CORE_SHORTCUTS.CYCLE_CLIP_PLANE)}
              keepOpen={true}
            />
            <hr />
            <MenuEntry label="Show All" onClick={() => (hideUI.value = 3)} keepOpen={true} />
            <MenuEntry
              label="Hide UI"
              onClick={() => (hideUI.value = 2)}
              shortcut={formatShortcut(UI_SHORTCUTS.HIDE_UI)}
              keepOpen={true}
            />
            <MenuEntry label="Hide All" onClick={() => (hideUI.value = 0)} keepOpen={true} />
            <hr />
            <MenuEntry
              label="Reset View"
              onClick={resetZoom}
              shortcut={formatShortcut(UI_SHORTCUTS.RESET_VIEW)}
            />
            <hr />
            <ToggleEntry
              label="Interpolation"
              state={interpolation}
              shortcut={formatShortcut(UI_SHORTCUTS.TOGGLE_INTERPOLATION)}
            />
            <ToggleEntry
              label="Colorbar"
              state={colorbar}
              shortcut={formatShortcut(UI_SHORTCUTS.TOGGLE_COLORBAR)}
            />
            <ToggleEntry
              label="Radiological"
              state={radiologicalConvention}
              shortcut={formatShortcut(UI_SHORTCUTS.TOGGLE_RADIOLOGICAL)}
            />
            <ToggleEntry
              label="Crosshair"
              state={crosshair}
              shortcut={formatShortcut(UI_SHORTCUTS.TOGGLE_CROSSHAIR)}
            />
            <hr />
            {!isVscode && <MenuEntry label="Save Settings" onClick={saveSettings} />}
          </MenuItem>
        )}
        {settings.value.menuItems?.zoom && (
          <MenuToggle
            label="Zoom"
            state={zoomDragMode}
            shortcut={formatShortcut(UI_SHORTCUTS.TOGGLE_ZOOM_MODE)}
          />
        )}
        {settings.value.menuItems?.colorScale && (
          <MenuItem
            label="ColorScale"
            visible={isVolumeOrMesh}
            onClick={openColorScaleLastOverlay}
            shortcut={formatShortcut(UI_SHORTCUTS.COLORSCALE)}
          >
            <MenuEntry label="Volume" onClick={openColorScale(0)} visible={isVolume} />
            {Array.from({ length: nOverlays.value }, (_, i) => (
              <MenuEntry key={i} label={`Overlay ${i + 1}`} onClick={openColorScale(i + 1)} />
            ))}
          </MenuItem>
        )}
        {settings.value.menuItems?.overlay && (
          <MenuItem
            label="Overlay"
            onClick={overlayButtonOnClick}
            visible={isVolumeOrMesh}
            shortcut={formatShortcut(UI_SHORTCUTS.ADD_OVERLAY)}
          >
            <MenuEntry label="Add" onClick={addOverlay} visible={isVolume} />
            <MenuEntry label="MeshOverlay" onClick={addMeshOverlay} visible={isMesh} />
            <MenuEntry label="Curvature" onClick={addCurvature} visible={isMesh} />
            <MenuEntry label="ImageOverlay" onClick={addOverlay} visible={isMesh} />
            <MenuEntry label="Replace" onClick={replaceLastVolume} visible={isOverlay} />
            <MenuEntry label="Remove" onClick={removeLastVolume} visible={isOverlay} />
          </MenuItem>
        )}
        {settings.value.menuItems?.header && (
          <MenuItem
            label="Header"
            onClick={toggle(headerDialog)}
            visible={isVolume}
            shortcut={formatShortcut(UI_SHORTCUTS.SHOW_HEADER)}
          >
            <MenuEntry label="Set Headers to 1" onClick={setVoxelSize1AndOrigin0} />
            <MenuEntry label="Set Header" onClick={toggle(setHeaderMenu)} />
          </MenuItem>
        )}
        <MenuItem label="Navigation" visible={isVolume}>
          <MenuEntry
            label="Next Volume (4D)"
            onClick={volumeNext}
            shortcut={formatShortcut(NIIVUE_CORE_SHORTCUTS.VOLUME_NEXT)}
            keepOpen={true}
            visible={has4D}
          />
          <MenuEntry
            label="Previous Volume (4D)"
            onClick={volumePrev}
            shortcut={formatShortcut(NIIVUE_CORE_SHORTCUTS.VOLUME_PREV)}
            keepOpen={true}
            visible={has4D}
          />
          <hr />
          <MenuEntry
            label="Crosshair: Right"
            onClick={crosshairRight}
            shortcut={formatShortcut(NIIVUE_CORE_SHORTCUTS.CROSSHAIR_RIGHT)}
            keepOpen={true}
          />
          <MenuEntry
            label="Crosshair: Left"
            onClick={crosshairLeft}
            shortcut={formatShortcut(NIIVUE_CORE_SHORTCUTS.CROSSHAIR_LEFT)}
            keepOpen={true}
          />
          <MenuEntry
            label="Crosshair: Anterior"
            onClick={crosshairAnterior}
            shortcut={formatShortcut(NIIVUE_CORE_SHORTCUTS.CROSSHAIR_ANTERIOR)}
            keepOpen={true}
          />
          <MenuEntry
            label="Crosshair: Posterior"
            onClick={crosshairPosterior}
            shortcut={formatShortcut(NIIVUE_CORE_SHORTCUTS.CROSSHAIR_POSTERIOR)}
            keepOpen={true}
          />
          <MenuEntry
            label="Crosshair: Superior"
            onClick={crosshairSuperior}
            shortcut={formatShortcut(UI_SHORTCUTS.CROSSHAIR_SUPERIOR)}
            keepOpen={true}
          />
          <MenuEntry
            label="Crosshair: Inferior"
            onClick={crosshairInferior}
            shortcut={formatShortcut(UI_SHORTCUTS.CROSSHAIR_INFERIOR)}
            keepOpen={true}
          />
        </MenuItem>
        <ImageSelect label="Select" state={selectionActive} visible={multipleVolumes}>
          <ToggleEntry label="Multiple" state={selectMultiple} />
          <MenuEntry label="Select All" onClick={selectAll} />
        </ImageSelect>
      </div>
      <p className="pl-2">{displayInfo.value}</p>
      <ScalingBox
        selectedOverlayNumber={selectedOverlayNumber}
        overlayMenu={overlayMenu}
        nvArraySelected={nvArraySelected}
        visible={overlayMenu}
      />
      <HeaderBox nvArraySelected={nvArraySelected} nvArray={nvArray} visible={setHeaderMenu} />
      <HeaderDialog nvArraySelected={nvArraySelected} isOpen={headerDialog} />
    </>
  )
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
  else if (selectionMode.value == SelectionMode.SINGLE && selection.value.length != 1) {
    selection.value = [0]
  } else if (
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
        // ignore
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
