/**
 * Application constants
 */

export const APP_CONFIG = {
  NAME: 'NiiVue Medical Image Viewer',
  SHORT_NAME: 'NiiVue',
  VERSION: '0.0.1',
  DESCRIPTION: 'Advanced web-based medical image viewer for NIfTI and DICOM files',
} as const

export const SUPPORTED_FILE_EXTENSIONS = [
  '.nii',
  '.nii.gz',
  '.dcm',
  '.mha',
  '.mhd',
  '.nhdr',
  '.nrrd',
  '.mgh',
  '.mgz',
  '.v',
  '.v16',
  '.vmr',
  '.gii',
  '.mz3',
] as const

export const SLICE_TYPES = {
  AXIAL: 0,
  CORONAL: 1,
  SAGITTAL: 2,
  MULTIPLANAR: 3,
  RENDER: 4,
} as const

export const STORAGE_KEYS = {
  USER_SETTINGS: 'userSettings',
  RECENT_FILES: 'recentFiles',
  LAYOUT_PREFERENCES: 'layoutPreferences',
} as const

export const EXTERNAL_URLS = {
  EXAMPLE_IMAGE: 'https://niivue.github.io/niivue-demo-images/mni152.nii.gz',
  DOCUMENTATION: 'https://niivue.github.io/niivue/',
  GITHUB: 'https://github.com/niivue/niivue',
} as const
