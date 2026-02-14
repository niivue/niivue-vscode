import { SLICE_TYPE } from '@niivue/niivue'
import { Signal, computed, effect, useSignal } from '@preact/signals'
import {
  ExtendedNiivue,
  addDcmFolderEvent,
  addImagesEvent,
  addOverlayEvent,
  openImageFromURL,
} from '../events'
import {
  BUILTIN_PRESETS,
  ViewPreset,
  createUserPreset,
  deleteUserPreset,
  loadUserPresets,
  saveUserPresets,
} from '../presets'
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
  const userPresets = useSignal(loadUserPresets())
  const showSavePresetDialog = useSignal(false)
  const presetNameInput = useSignal('')
  const presetDescInput = useSignal('')

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

  // Preset functions
  const applyPreset = (preset: ViewPreset) => {
    // Apply settings
    if (preset.settings.interpolation !== undefined) {
      interpolation.value = preset.settings.interpolation
    }
    if (preset.settings.showCrosshairs !== undefined) {
      crosshair.value = preset.settings.showCrosshairs
    }
    if (preset.settings.radiologicalConvention !== undefined) {
      radiologicalConvention.value = preset.settings.radiologicalConvention
    }
    if (preset.settings.colorbar !== undefined) {
      colorbar.value = preset.settings.colorbar
    }
    if (preset.settings.zoomDragMode !== undefined) {
      zoomDragMode.value = preset.settings.zoomDragMode
    }

    // Apply colormap defaults
    if (preset.settings.defaultVolumeColormap) {
      nvArraySelected.value.forEach((nv) => {
        if (nv.volumes.length > 0) {
          nv.volumes[0].colormap = preset.settings.defaultVolumeColormap!
        }
      })
    }
    if (preset.settings.defaultOverlayColormap) {
      nvArraySelected.value.forEach((nv) => {
        if (nv.volumes.length > 1) {
          nv.volumes[1].colormap = preset.settings.defaultOverlayColormap!
        }
      })
    }

    // Apply view options
    if (preset.viewOptions) {
      if (preset.viewOptions.sliceType !== undefined) {
        sliceType.value = preset.viewOptions.sliceType
      }
      if (preset.viewOptions.hideUI !== undefined) {
        hideUI.value = preset.viewOptions.hideUI
      }

      // Apply special view settings for fMRI-like presets
      if (
        preset.viewOptions.autoSizeMultiplanar !== undefined ||
        preset.viewOptions.multiplanarForceRender !== undefined
      ) {
        nvArraySelected.value.forEach((nv) => {
          if (preset.viewOptions!.autoSizeMultiplanar !== undefined) {
            nv.graph.autoSizeMultiplanar = preset.viewOptions!.autoSizeMultiplanar
          }
          if (preset.viewOptions!.multiplanarForceRender !== undefined) {
            nv.opts.multiplanarForceRender = preset.viewOptions!.multiplanarForceRender
          }
          if (preset.viewOptions!.normalizeValues !== undefined) {
            nv.graph.normalizeValues = preset.viewOptions!.normalizeValues
          }
          if (preset.viewOptions!.graphOpacity !== undefined) {
            nv.graph.opacity = preset.viewOptions!.graphOpacity
          }
        })
      }
    }

    // Apply overlay defaults (e.g., for phase data)
    if (preset.overlayDefaults) {
      nvArraySelected.value.forEach((nv) => {
        nv.volumes.forEach((vol: any) => {
          if (preset.overlayDefaults!.cal_min !== undefined) {
            // Only apply if not already set
            if (vol.cal_min === vol.global_min || vol.cal_min === 0) {
              vol.cal_min = preset.overlayDefaults!.cal_min
            }
          }
          if (preset.overlayDefaults!.cal_max !== undefined) {
            if (vol.cal_max === vol.global_max || vol.cal_max === 0) {
              vol.cal_max = preset.overlayDefaults!.cal_max
            }
          }
          if (preset.overlayDefaults!.colormap) {
            vol.colormap = preset.overlayDefaults!.colormap
          }
          if (preset.overlayDefaults!.opacity !== undefined) {
            vol.opacity = preset.overlayDefaults!.opacity
          }
        })
      })
    }

    // Update the display
    nvArraySelected.value.forEach((nv) => {
      nv.updateGLVolume()
    })
    nvArray.value = [...nvArray.value]
  }

  const saveCurrentAsPreset = () => {
    if (!presetNameInput.value.trim()) {
      alert('Please enter a name for the preset')
      return
    }

    const currentSettings = {
      interpolation: interpolation.value,
      showCrosshairs: crosshair.value,
      radiologicalConvention: radiologicalConvention.value,
      colorbar: colorbar.value,
      zoomDragMode: zoomDragMode.value,
    }

    const viewOptions = {
      sliceType: sliceType.value,
      hideUI: hideUI.value,
    }

    const newPreset = createUserPreset(
      presetNameInput.value,
      presetDescInput.value || 'Custom user preset',
      currentSettings,
      viewOptions,
    )

    const presets = [...userPresets.value, newPreset]
    saveUserPresets(presets)
    userPresets.value = presets

    presetNameInput.value = ''
    presetDescInput.value = ''
    showSavePresetDialog.value = false

    alert(`Preset "${newPreset.name}" saved!`)
  }

  const deletePreset = (id: string) => {
    deleteUserPreset(id)
    userPresets.value = loadUserPresets()
  }

  return (
    <>
      <div className="flex flex-wrap items-baseline gap-2">
        {!isVscode && <MenuButton label="Home" onClick={homeEvent} />}
        <MenuItem label="Add Image" onClick={addImagesEvent}>
          <MenuEntry label="File(s)" onClick={addImagesEvent} />
          <MenuEntry label="DICOM Folder" onClick={addDcmFolderEvent} />
          <MenuEntry
            label="Example Image"
            onClick={() =>
              openImageFromURL('https://niivue.github.io/niivue-demo-images/mni152.nii.gz')
            }
          />
        </MenuItem>
        <MenuItem label="View" onClick={resetZoom}>
          <MenuEntry label="Axial" onClick={() => (sliceType.value = SLICE_TYPE.AXIAL)} />
          <MenuEntry label="Sagittal" onClick={() => (sliceType.value = SLICE_TYPE.SAGITTAL)} />
          <MenuEntry label="Coronal" onClick={() => (sliceType.value = SLICE_TYPE.CORONAL)} />
          <MenuEntry label="Render" onClick={() => (sliceType.value = SLICE_TYPE.RENDER)} />
          <MenuEntry label="Multiplanar + Render" onClick={setMultiplanar} />
          <MenuEntry
            label="Multiplanar + Timeseries"
            onClick={setTimeSeries}
            visible={isMultiEcho}
          />
          <hr />
          <MenuEntry label="Show All" onClick={() => (hideUI.value = 3)} />
          <MenuEntry label="Hide UI" onClick={() => (hideUI.value = 2)} />
          <MenuEntry label="Hide All" onClick={() => (hideUI.value = 0)} />
          <hr />
          <MenuEntry label="Reset View" onClick={resetZoom} />
          <hr />
          <ToggleEntry label="Interpolation" state={interpolation} />
          <ToggleEntry label="Colorbar" state={colorbar} />
          <ToggleEntry label="Radiological" state={radiologicalConvention} />
          <ToggleEntry label="Crosshair" state={crosshair} />
          <hr />
          {!isVscode && <MenuEntry label="Save Settings" onClick={saveSettings} />}
        </MenuItem>
        <MenuItem label="Presets">
          {Object.values(BUILTIN_PRESETS).map((preset) => (
            <MenuEntry
              key={preset.name}
              label={preset.name}
              onClick={() => applyPreset(preset)}
            />
          ))}
          {userPresets.value.length > 0 && <hr />}
          {userPresets.value.map((preset) => (
            <div key={preset.id} className="flex items-center justify-between">
              <MenuEntry label={preset.name} onClick={() => applyPreset(preset)} />
              <button
                className="text-xs px-1 hover:text-red-500"
                onClick={() => deletePreset(preset.id)}
                title="Delete preset"
              >
                ✕
              </button>
            </div>
          ))}
          <hr />
          <MenuEntry label="Save Current as Preset" onClick={toggle(showSavePresetDialog)} />
        </MenuItem>
        <MenuToggle label="Zoom" state={zoomDragMode} />
        <MenuItem label="ColorScale" visible={isVolumeOrMesh} onClick={openColorScaleLastOverlay}>
          <MenuEntry label="Volume" onClick={openColorScale(0)} visible={isVolume} />
          {Array.from({ length: nOverlays.value }, (_, i) => (
            <MenuEntry key={i} label={`Overlay ${i + 1}`} onClick={openColorScale(i + 1)} />
          ))}
        </MenuItem>
        <MenuItem label="Overlay" onClick={overlayButtonOnClick} visible={isVolumeOrMesh}>
          <MenuEntry label="Add" onClick={addOverlay} visible={isVolume} />
          <MenuEntry label="MeshOverlay" onClick={addMeshOverlay} visible={isMesh} />
          <MenuEntry label="Curvature" onClick={addCurvature} visible={isMesh} />
          <MenuEntry label="ImageOverlay" onClick={addOverlay} visible={isMesh} />
          <MenuEntry label="Replace" onClick={replaceLastVolume} visible={isOverlay} />
          <MenuEntry label="Remove" onClick={removeLastVolume} visible={isOverlay} />
        </MenuItem>
        <MenuItem label="Header" onClick={toggle(headerDialog)} visible={isVolume}>
          <MenuEntry label="Set Headers to 1" onClick={setVoxelSize1AndOrigin0} />
          <MenuEntry label="Set Header" onClick={toggle(setHeaderMenu)} />
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
      {showSavePresetDialog.value && (
        <div className="absolute left-8 top-8 bg-gray-700 rounded-md z-50 p-4 space-y-2 min-w-64">
          <h3 className="text-lg font-bold">Save Preset</h3>
          <div>
            <label className="block text-sm">Name:</label>
            <input
              className="bg-gray-600 w-full border-2 border-gray-600 rounded-md px-2 py-1"
              type="text"
              value={presetNameInput.value}
              onInput={(e: any) => (presetNameInput.value = e.target.value)}
              placeholder="Enter preset name"
            />
          </div>
          <div>
            <label className="block text-sm">Description (optional):</label>
            <input
              className="bg-gray-600 w-full border-2 border-gray-600 rounded-md px-2 py-1"
              type="text"
              value={presetDescInput.value}
              onInput={(e: any) => (presetDescInput.value = e.target.value)}
              placeholder="Enter description"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              className="bg-gray-600 border-2 border-gray-600 rounded-md px-3 py-1"
              onClick={() => (showSavePresetDialog.value = false)}
            >
              Cancel
            </button>
            <button
              className="bg-blue-600 border-2 border-blue-600 rounded-md px-3 py-1"
              onClick={saveCurrentAsPreset}
            >
              Save
            </button>
          </div>
        </div>
      )}
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
