import { expect, test } from 'vitest'
import {
  BUILTIN_PRESETS,
  createUserPreset,
  getDefaultPreset,
  getDefaultPresetRef,
  loadUserPresets,
  saveUserPresets,
  setDefaultPreset,
  clearDefaultPreset,
  deleteUserPreset,
} from '../presets'

test('builtin presets should exist', () => {
  expect(BUILTIN_PRESETS).toBeDefined()
  expect(BUILTIN_PRESETS.fmri).toBeDefined()
  expect(BUILTIN_PRESETS.phase).toBeDefined()
  expect(BUILTIN_PRESETS.anatomical).toBeDefined()
  expect(BUILTIN_PRESETS.dti).toBeDefined()
})

test('fMRI preset should have correct settings', () => {
  const fmriPreset = BUILTIN_PRESETS.fmri
  expect(fmriPreset.name).toBe('fMRI')
  expect(fmriPreset.settings.interpolation).toBe(true)
  expect(fmriPreset.settings.showCrosshairs).toBe(true)
  expect(fmriPreset.settings.colorbar).toBe(true)
  expect(fmriPreset.viewOptions?.autoSizeMultiplanar).toBe(true)
  expect(fmriPreset.viewOptions?.multiplanarForceRender).toBe(true)
})

test('phase preset should have correct settings', () => {
  const phasePreset = BUILTIN_PRESETS.phase
  expect(phasePreset.name).toBe('Phase Data')
  expect(phasePreset.settings.interpolation).toBe(false)
  expect(phasePreset.settings.colorbar).toBe(true)
  expect(phasePreset.settings.defaultVolumeColormap).toBe('hsv')
  expect(phasePreset.baseImageDefaults?.cal_min).toBe(-Math.PI)
  expect(phasePreset.baseImageDefaults?.cal_max).toBe(Math.PI)
})

test('create user preset', () => {
  const preset = createUserPreset('My Preset', 'Test description', { interpolation: false })
  expect(preset.name).toBe('My Preset')
  expect(preset.description).toBe('Test description')
  expect(preset.settings.interpolation).toBe(false)
  expect(preset.id).toMatch(/^user_\d+$/)
  expect(preset.createdAt).toBeDefined()
})

test('save and load user presets', () => {
  localStorage.clear()
  
  const preset1 = createUserPreset('Preset 1', 'First preset', { interpolation: true })
  const preset2 = createUserPreset('Preset 2', 'Second preset', { colorbar: true })

  saveUserPresets([preset1, preset2])
  const loaded = loadUserPresets()

  expect(loaded).toHaveLength(2)
  expect(loaded[0].name).toBe('Preset 1')
  expect(loaded[1].name).toBe('Preset 2')
  
  localStorage.clear()
})

test('delete user preset', () => {
  localStorage.clear()

  const preset1 = createUserPreset('Preset 1', 'First preset', { interpolation: true })
  preset1.id = 'user_test_del_1'
  const preset2 = createUserPreset('Preset 2', 'Second preset', { colorbar: true })
  preset2.id = 'user_test_del_2'

  saveUserPresets([preset1, preset2])

  const beforeDelete = loadUserPresets()
  expect(beforeDelete).toHaveLength(2)

  deleteUserPreset(preset1.id)

  const loaded = loadUserPresets()
  expect(loaded).toHaveLength(1)
  expect(loaded[0].id).toBe(preset2.id)
  expect(loaded[0].name).toBe('Preset 2')

  localStorage.clear()
})

test('create user preset with colorscale options', () => {
  const baseDefaults = {
    cal_min: 0,
    cal_max: 100,
    colormap: 'gray',
    opacity: 1.0,
    colormapInvert: false,
  }
  const overlayDefaults = {
    cal_min: -5,
    cal_max: 5,
    colormap: 'redyell',
    opacity: 0.7,
    colormapInvert: true,
  }
  const preset = createUserPreset(
    'Full Preset',
    'Preset with colorscale',
    { interpolation: true },
    { sliceType: 3 },
    baseDefaults,
    overlayDefaults,
  )
  expect(preset.baseImageDefaults?.cal_min).toBe(0)
  expect(preset.baseImageDefaults?.cal_max).toBe(100)
  expect(preset.baseImageDefaults?.colormap).toBe('gray')
  expect(preset.baseImageDefaults?.opacity).toBe(1.0)
  expect(preset.baseImageDefaults?.colormapInvert).toBe(false)
  expect(preset.overlayDefaults?.cal_min).toBe(-5)
  expect(preset.overlayDefaults?.cal_max).toBe(5)
  expect(preset.overlayDefaults?.colormap).toBe('redyell')
  expect(preset.overlayDefaults?.opacity).toBe(0.7)
  expect(preset.overlayDefaults?.colormapInvert).toBe(true)
})

test('set and get default user preset', () => {
  localStorage.clear()

  const preset1 = createUserPreset('Preset 1', 'First preset', { interpolation: true })
  preset1.id = 'user_test_1'
  const preset2 = createUserPreset('Preset 2', 'Second preset', { colorbar: true })
  preset2.id = 'user_test_2'
  saveUserPresets([preset1, preset2])

  // Initially no default
  expect(getDefaultPreset()).toBeUndefined()
  expect(getDefaultPresetRef()).toBeNull()

  // Set preset2 as default
  setDefaultPreset('user', preset2.id)
  const ref = getDefaultPresetRef()
  expect(ref).toEqual({ type: 'user', id: 'user_test_2' })
  const defaultP = getDefaultPreset()
  expect(defaultP).toBeDefined()
  expect(defaultP!.name).toBe('Preset 2')

  // Clear default
  clearDefaultPreset()
  expect(getDefaultPreset()).toBeUndefined()
  expect(getDefaultPresetRef()).toBeNull()

  localStorage.clear()
})

test('set and get default builtin preset', () => {
  localStorage.clear()

  // Initially no default
  expect(getDefaultPreset()).toBeUndefined()

  // Set fmri as default
  setDefaultPreset('builtin', 'fmri')
  const ref = getDefaultPresetRef()
  expect(ref).toEqual({ type: 'builtin', id: 'fmri' })
  const defaultP = getDefaultPreset()
  expect(defaultP).toBeDefined()
  expect(defaultP!.name).toBe('fMRI')

  // Switch to phase
  setDefaultPreset('builtin', 'phase')
  const ref2 = getDefaultPresetRef()
  expect(ref2).toEqual({ type: 'builtin', id: 'phase' })
  const defaultP2 = getDefaultPreset()
  expect(defaultP2!.name).toBe('Phase Data')

  // Clear default
  clearDefaultPreset()
  expect(getDefaultPreset()).toBeUndefined()

  localStorage.clear()
})

test('switching default between builtin and user presets', () => {
  localStorage.clear()

  const userPreset = createUserPreset('My Preset', 'desc', { interpolation: false })
  userPreset.id = 'user_test_switch'
  saveUserPresets([userPreset])

  // Set builtin as default
  setDefaultPreset('builtin', 'anatomical')
  expect(getDefaultPresetRef()).toEqual({ type: 'builtin', id: 'anatomical' })

  // Switch to user preset
  setDefaultPreset('user', 'user_test_switch')
  expect(getDefaultPresetRef()).toEqual({ type: 'user', id: 'user_test_switch' })
  expect(getDefaultPreset()!.name).toBe('My Preset')

  localStorage.clear()
})
