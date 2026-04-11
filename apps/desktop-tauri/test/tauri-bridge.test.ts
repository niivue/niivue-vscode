import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @tauri-apps/api/core before importing the bridge
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

import { isTauri, readFileBytes, getFileInfo, listDirectory, MEDICAL_IMAGE_EXTENSIONS } from '../src/tauri-bridge'
import { invoke } from '@tauri-apps/api/core'

const mockInvoke = vi.mocked(invoke)

describe('tauri-bridge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isTauri', () => {
    it('returns false when __TAURI_INTERNALS__ is not in window', () => {
      // jsdom does not have __TAURI_INTERNALS__
      expect(isTauri()).toBe(false)
    })

    it('returns true when __TAURI_INTERNALS__ is in window', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).__TAURI_INTERNALS__ = {}
      expect(isTauri()).toBe(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).__TAURI_INTERNALS__
    })
  })

  describe('readFileBytes', () => {
    it('invokes read_file_bytes command and returns Uint8Array', async () => {
      mockInvoke.mockResolvedValue([72, 101, 108, 108, 111])
      const result = await readFileBytes('/path/to/file.nii')
      expect(mockInvoke).toHaveBeenCalledWith('read_file_bytes', { path: '/path/to/file.nii' })
      expect(result).toBeInstanceOf(Uint8Array)
      expect(Array.from(result)).toEqual([72, 101, 108, 108, 111])
    })

    it('propagates errors from the Rust command', async () => {
      mockInvoke.mockRejectedValue(new Error('File not found'))
      await expect(readFileBytes('/nonexistent')).rejects.toThrow('File not found')
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
