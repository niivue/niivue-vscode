import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @tauri-apps/plugin-store before importing
vi.mock('@tauri-apps/plugin-store', () => {
  const store = new Map<string, unknown>()
  return {
    load: vi.fn().mockResolvedValue({
      get: vi.fn((key: string) => Promise.resolve(store.get(key))),
      set: vi.fn((key: string, value: unknown) => {
        store.set(key, value)
        return Promise.resolve()
      }),
      save: vi.fn().mockResolvedValue(undefined),
      // Expose internal store for test inspection
      _store: store,
    }),
  }
})

import { getRecentFiles, addRecentFile, clearRecentFiles, type RecentFileEntry } from '../src/recent-files'
import { load } from '@tauri-apps/plugin-store'

describe('recent-files', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    // Reset the mock store
    const store = await load('recent-files.json', { defaults: {}, autoSave: false })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(store as any)._store.clear()
  })

  describe('getRecentFiles', () => {
    it('returns an empty array when no files have been stored', async () => {
      const result = await getRecentFiles()
      expect(result).toEqual([])
    })

    it('returns stored files', async () => {
      const files: RecentFileEntry[] = [
        { path: '/path/a.nii', name: 'a.nii', openedAt: '2024-01-01T00:00:00.000Z' },
      ]
      const store = await load('recent-files.json', { defaults: {}, autoSave: false })
      await store.set('recentFiles', files)

      const result = await getRecentFiles()
      expect(result).toEqual(files)
    })
  })

  describe('addRecentFile', () => {
    it('adds a new file to the recent list', async () => {
      await addRecentFile('/path/brain.nii', 'brain.nii')
      const result = await getRecentFiles()
      expect(result).toHaveLength(1)
      expect(result[0]?.path).toBe('/path/brain.nii')
      expect(result[0]?.name).toBe('brain.nii')
    })

    it('moves duplicate to the top', async () => {
      await addRecentFile('/path/a.nii', 'a.nii')
      await addRecentFile('/path/b.nii', 'b.nii')
      await addRecentFile('/path/a.nii', 'a.nii')
      const result = await getRecentFiles()
      expect(result).toHaveLength(2)
      expect(result[0]?.path).toBe('/path/a.nii')
      expect(result[1]?.path).toBe('/path/b.nii')
    })

    it('trims list to 20 entries', async () => {
      for (let i = 0; i < 25; i++) {
        await addRecentFile(`/path/file${i}.nii`, `file${i}.nii`)
      }
      const result = await getRecentFiles()
      expect(result.length).toBeLessThanOrEqual(20)
    })
  })

  describe('clearRecentFiles', () => {
    it('removes all recent files', async () => {
      await addRecentFile('/path/a.nii', 'a.nii')
      await clearRecentFiles()
      const result = await getRecentFiles()
      expect(result).toEqual([])
    })
  })
})
