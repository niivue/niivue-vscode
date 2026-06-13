/**
 * Tests for DesktopHomeScreen: the rendered output and the multi-file
 * open flow that orchestrates registerOpenedPath + initCanvas + per-file
 * loads.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, render } from '@testing-library/preact'

// Mock at the SDK level: `tauri-bridge.ts` re-exports `isTauri` from
// `@tauri-apps/api/core`, so mocking the SDK propagates through to anything
// the component imports from the bridge. If the bridge ever memoises the
// result or inlines the call, switch this to mock '../src/tauri-bridge'
// directly so the test still pins the value at the call site.
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
  isTauri: vi.fn(() => true),
}))

const { openMock } = vi.hoisted(() => ({ openMock: vi.fn() }))
vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: openMock,
}))

vi.mock('@tauri-apps/plugin-store', () => ({
  load: vi.fn().mockResolvedValue({
    get: vi.fn().mockResolvedValue([]),
    set: vi.fn().mockResolvedValue(undefined),
    save: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock('@niivue/react', () => ({
  Container: () => null,
  ImageDrop: ({ children }: { children: unknown }) => children,
  Menu: () => null,
  listenToMessages: vi.fn(),
}))

import { invoke, isTauri as tauriIsTauri } from '@tauri-apps/api/core'
import { DesktopHomeScreen } from '../src/components/DesktopHomeScreen'

const mockInvoke = vi.mocked(invoke)
const mockTauriIsTauri = vi.mocked(tauriIsTauri)

describe('DesktopHomeScreen', () => {
  let postMessageSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockTauriIsTauri.mockReturnValue(true)
    postMessageSpy = vi.spyOn(window, 'postMessage').mockImplementation(() => {})
  })

  afterEach(() => {
    postMessageSpy.mockRestore()
  })

  describe('rendering', () => {
    it('shows the Open File button when running inside Tauri', () => {
      const { getByText } = render(<DesktopHomeScreen />)
      expect(getByText(/Open File/)).toBeInTheDocument()
    })

    it('hides the Open File button when not in Tauri', () => {
      mockTauriIsTauri.mockReturnValue(false)
      const { queryByText } = render(<DesktopHomeScreen />)
      expect(queryByText(/Open File/)).toBeNull()
    })

    it('describes supported formats and the data-privacy guarantee', () => {
      const { getByText } = render(<DesktopHomeScreen />)
      expect(getByText(/Supported Formats/)).toBeInTheDocument()
      expect(getByText(/Data Privacy/)).toBeInTheDocument()
    })
  })

  describe('handleOpenFile', () => {
    it('returns silently when no file is selected', async () => {
      openMock.mockResolvedValueOnce(null)
      const { getByText } = render(<DesktopHomeScreen />)
      fireEvent.click(getByText(/Open File/))
      // Yield once so any awaited microtasks settle.
      await Promise.resolve()
      expect(mockInvoke).not.toHaveBeenCalled()
      expect(postMessageSpy).not.toHaveBeenCalled()
    })

    it('registers each path, provisions canvases once, then loads in order', async () => {
      openMock.mockResolvedValueOnce(['/a/scan1.nii', '/b/scan2.nii'])
      // For each file: register_opened_path -> read_file_bytes -> recent-files
      // We only constrain read_file_bytes to return a buffer.
      mockInvoke.mockImplementation(async (cmd: string) => {
        if (cmd === 'read_file_bytes') return new Uint8Array([1, 2, 3]).buffer
        return undefined
      })

      const { getByText } = render(<DesktopHomeScreen />)
      fireEvent.click(getByText(/Open File/))
      // The click handler is async; let all chained microtasks flush.
      await new Promise((r) => setTimeout(r, 0))

      // Both paths registered before any read.
      const registerCalls = mockInvoke.mock.calls.filter(([cmd]) => cmd === 'register_opened_path')
      expect(registerCalls).toHaveLength(2)
      expect(registerCalls.map((c) => (c[1] as { path: string }).path)).toEqual([
        '/a/scan1.nii',
        '/b/scan2.nii',
      ])

      // Exactly one initCanvas post, with n = number of paths.
      const initCalls = postMessageSpy.mock.calls.filter(
        ([msg]: unknown[]) => (msg as { type: string }).type === 'initCanvas',
      )
      expect(initCalls).toHaveLength(1)
      expect((initCalls[0]?.[0] as { body: { n: number } }).body.n).toBe(2)

      // One addImage post per file, in input order, with basename-derived uri.
      const addCalls = postMessageSpy.mock.calls.filter(
        ([msg]: unknown[]) => (msg as { type: string }).type === 'addImage',
      )
      expect(addCalls).toHaveLength(2)
      expect((addCalls[0]?.[0] as { body: { uri: string } }).body.uri).toBe('scan1.nii')
      expect((addCalls[1]?.[0] as { body: { uri: string } }).body.uri).toBe('scan2.nii')
    })

    it('falls through with a single-string selection (non-array dialog return)', async () => {
      openMock.mockResolvedValueOnce('/single/file.nii')
      mockInvoke.mockImplementation(async (cmd: string) => {
        if (cmd === 'read_file_bytes') return new Uint8Array().buffer
        return undefined
      })

      const { getByText } = render(<DesktopHomeScreen />)
      fireEvent.click(getByText(/Open File/))
      await new Promise((r) => setTimeout(r, 0))

      const registerCalls = mockInvoke.mock.calls.filter(([cmd]) => cmd === 'register_opened_path')
      expect(registerCalls).toHaveLength(1)
      const initCall = postMessageSpy.mock.calls.find(
        ([msg]: unknown[]) => (msg as { type: string }).type === 'initCanvas',
      )
      expect(initCall?.[0]).toEqual({ type: 'initCanvas', body: { n: 1 } })
    })
  })
})
