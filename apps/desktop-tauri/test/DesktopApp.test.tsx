/**
 * Tests for the standalone helpers exported from DesktopApp.tsx.
 *
 * The DesktopApp component itself depends on `@niivue/react`'s
 * `listenToMessages` (which initialises NiiVue + WebGL), which is too
 * heavy to wire up in jsdom. We exercise `loadFileFromPath` in isolation
 * because that is where the actual IPC contract lives.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
  isTauri: vi.fn(() => true),
}))

vi.mock('@tauri-apps/plugin-dialog', () => ({
  message: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@tauri-apps/plugin-store', () => ({
  load: vi.fn().mockResolvedValue({
    get: vi.fn().mockResolvedValue([]),
    set: vi.fn().mockResolvedValue(undefined),
    save: vi.fn().mockResolvedValue(undefined),
  }),
}))

// Mock @niivue/react so loadFileFromPath can be imported without dragging
// in the heavy NiiVue/WebGL initialisation surface.
vi.mock('@niivue/react', () => ({
  Container: () => null,
  ImageDrop: ({ children }: { children: unknown }) => children,
  Menu: () => null,
  listenToMessages: vi.fn(),
  setFileSaver: vi.fn(),
}))

import { invoke } from '@tauri-apps/api/core'
import { message } from '@tauri-apps/plugin-dialog'
import { loadFileFromPath, saveWithNativeDialog } from '../src/components/DesktopApp'

const mockInvoke = vi.mocked(invoke)

describe('saveWithNativeDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('saves through the save_file command', async () => {
    mockInvoke.mockResolvedValue('/scans/brain.nvd')
    const bytes = new Uint8Array([7, 8])

    expect(await saveWithNativeDialog(bytes, 'brain.nvd')).toBe('/scans/brain.nvd')

    expect(mockInvoke).toHaveBeenCalledWith('save_file', bytes, {
      headers: { 'x-file-name': 'brain.nvd' },
    })
    expect(message).not.toHaveBeenCalled()
  })

  it('shows why a file could not be saved', async () => {
    mockInvoke.mockRejectedValue('Failed to write /readonly/brain.nvd: Access is denied.')

    expect(await saveWithNativeDialog(new Uint8Array([7]), 'brain.nvd')).toBeNull()

    expect(message).toHaveBeenCalledWith('Failed to write /readonly/brain.nvd: Access is denied.', {
      title: 'Could not save brain.nvd',
      kind: 'error',
    })
  })
})

describe('loadFileFromPath', () => {
  let postMessageSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    postMessageSpy = vi.spyOn(window, 'postMessage').mockImplementation(() => {})
  })

  afterEach(() => {
    postMessageSpy.mockRestore()
  })

  it('reads file bytes via the bridge and posts addImage with the buffer + uri', async () => {
    const bytes = new Uint8Array([0x42, 0x43, 0x44])
    // First invoke = read_file_bytes (returns ArrayBuffer)
    // Subsequent invokes = recent-files store ops (we don't care)
    mockInvoke.mockResolvedValueOnce(bytes.buffer)
    mockInvoke.mockResolvedValue(undefined)

    await loadFileFromPath('/scans/brain.nii', 'brain.nii')

    expect(mockInvoke).toHaveBeenCalledWith('read_file_bytes', { path: '/scans/brain.nii' })
    expect(postMessageSpy).toHaveBeenCalledTimes(1)
    const arg = postMessageSpy.mock.calls[0][0] as { type: string; body: { data: ArrayBuffer; uri: string } }
    expect(arg.type).toBe('addImage')
    expect(arg.body.uri).toBe('brain.nii')
    // Same buffer round-trips through the postMessage payload.
    expect(new Uint8Array(arg.body.data)).toEqual(bytes)
  })

  it('does not post addImage when the Rust read fails', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('Path not authorized'))

    await expect(loadFileFromPath('/blocked', 'blocked')).rejects.toThrow('Path not authorized')
    expect(postMessageSpy).not.toHaveBeenCalled()
  })
})
