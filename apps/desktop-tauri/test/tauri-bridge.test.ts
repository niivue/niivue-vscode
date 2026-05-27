import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @tauri-apps/api/core before importing the bridge
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
  isTauri: vi.fn(() => false),
}))

import {
  isTauri,
  readFileBytes,
  getFileInfo,
  listDirectory,
  registerOpenedPath,
  MEDICAL_IMAGE_EXTENSIONS,
} from '../src/tauri-bridge'
import { invoke, isTauri as tauriIsTauri } from '@tauri-apps/api/core'

const mockInvoke = vi.mocked(invoke)
const mockTauriIsTauri = vi.mocked(tauriIsTauri)

describe('tauri-bridge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTauriIsTauri.mockReturnValue(false)
  })

  describe('isTauri', () => {
    it('delegates to the public Tauri API', () => {
      mockTauriIsTauri.mockReturnValue(true)
      expect(isTauri()).toBe(true)
      mockTauriIsTauri.mockReturnValue(false)
      expect(isTauri()).toBe(false)
    })
  })

  describe('registerOpenedPath', () => {
    it('invokes register_opened_path with the given path', async () => {
      mockInvoke.mockResolvedValue(undefined)
      await registerOpenedPath('/path/to/file.nii')
      expect(mockInvoke).toHaveBeenCalledWith('register_opened_path', {
        path: '/path/to/file.nii',
      })
    })
  })

  describe('readFileBytes', () => {
    it('wraps the ArrayBuffer response in a Uint8Array', async () => {
      const buf = new Uint8Array([72, 101, 108, 108, 111]).buffer
      mockInvoke.mockResolvedValue(buf)
      const result = await readFileBytes('/path/to/file.nii')
      expect(mockInvoke).toHaveBeenCalledWith('read_file_bytes', { path: '/path/to/file.nii' })
      expect(result).toBeInstanceOf(Uint8Array)
      expect(Array.from(result)).toEqual([72, 101, 108, 108, 111])
    })

    it('propagates errors from the Rust command', async () => {
      mockInvoke.mockRejectedValue(new Error('Path not authorized'))
      await expect(readFileBytes('/nonexistent')).rejects.toThrow('Path not authorized')
    })
  })

  describe('getFileInfo', () => {
    it('invokes get_file_info command and returns metadata', async () => {
      const expected = { path: '/path/brain.nii', name: 'brain.nii', size: 1024 }
      mockInvoke.mockResolvedValue(expected)
      const result = await getFileInfo('/path/brain.nii')
      expect(mockInvoke).toHaveBeenCalledWith('get_file_info', { path: '/path/brain.nii' })
      expect(result).toEqual(expected)
    })
  })

  describe('listDirectory', () => {
    it('invokes list_directory with path and optional extensions', async () => {
      const expected = [
        { path: '/dir/a.nii', name: 'a.nii', size: 100 },
        { path: '/dir/b.nii.gz', name: 'b.nii.gz', size: 200 },
      ]
      mockInvoke.mockResolvedValue(expected)
      const result = await listDirectory('/dir', ['.nii', '.nii.gz'])
      expect(mockInvoke).toHaveBeenCalledWith('list_directory', {
        path: '/dir',
        extensions: ['.nii', '.nii.gz'],
      })
      expect(result).toEqual(expected)
    })

    it('invokes list_directory without extensions', async () => {
      mockInvoke.mockResolvedValue([])
      await listDirectory('/dir')
      expect(mockInvoke).toHaveBeenCalledWith('list_directory', {
        path: '/dir',
        extensions: undefined,
      })
    })
  })

  describe('MEDICAL_IMAGE_EXTENSIONS', () => {
    it('contains common medical imaging extensions', () => {
      expect(MEDICAL_IMAGE_EXTENSIONS).toContain('.nii')
      expect(MEDICAL_IMAGE_EXTENSIONS).toContain('.nii.gz')
      expect(MEDICAL_IMAGE_EXTENSIONS).toContain('.dcm')
      expect(MEDICAL_IMAGE_EXTENSIONS).toContain('.mgh')
      expect(MEDICAL_IMAGE_EXTENSIONS).toContain('.mgz')
      expect(MEDICAL_IMAGE_EXTENSIONS).toContain('.gii')
      expect(MEDICAL_IMAGE_EXTENSIONS).toContain('.nrrd')
    })
  })
})
