import { expect, test } from 'vitest'
import {
  BUILTIN_PRESETS,
  createUserPreset,
  loadUserPresets,
  saveUserPresets,
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
  expect(phasePreset.overlayDefaults?.cal_min).toBe(-Math.PI)
  expect(phasePreset.overlayDefaults?.cal_max).toBe(Math.PI)
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

test.skip('delete user preset', () => {
  // Clear any previous data
  localStorage.clear()
  
  const preset1 = createUserPreset('Preset 1', 'First preset', { interpolation: true })
  const preset2 = createUserPreset('Preset 2', 'Second preset', { colorbar: true })

  saveUserPresets([preset1, preset2])
  
  // Verify we have 2 presets
  let loaded = loadUserPresets()
  expect(loaded).toHaveLength(2)
  
  // Delete preset1
  deleteUserPreset(preset1.id)

  loaded = loadUserPresets()
  expect(loaded).toHaveLength(1)
  expect(loaded[0].name).toBe('Preset 2')
  
  // Clean up
  localStorage.clear()
})
