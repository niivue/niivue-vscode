import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * WebGPU -> WebGL2 attach fallback. Each test re-imports the module and stubs
 * `location` per scenario.
 */

async function loadBackend() {
  return await import('../backend')
}

beforeEach(() => {
  vi.resetModules()
  vi.unstubAllGlobals()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('attachWithBackendFallback', () => {
  it('attaches once and leaves opts.backend alone when it succeeds', async () => {
    const { attachWithBackendFallback } = await loadBackend()
    const nv: any = { opts: {}, attachToCanvas: vi.fn().mockResolvedValue(undefined) }
    const used = await attachWithBackendFallback(nv, {} as HTMLCanvasElement)
    expect(used).toBe('webgpu')
    expect(nv.opts.backend).toBeUndefined()
    expect(nv.attachToCanvas).toHaveBeenCalledTimes(1)
  })

  it('calls attachToCanvas synchronously, before any await', async () => {
    // Regression guard for #272: delaying the attach past its original tick
    // breaks niivue's canvas key handling.
    const { attachWithBackendFallback } = await loadBackend()
    const attachToCanvas = vi.fn().mockResolvedValue(undefined)
    const nv: any = { opts: {}, attachToCanvas }
    const promise = attachWithBackendFallback(nv, {} as HTMLCanvasElement)
    expect(attachToCanvas).toHaveBeenCalledTimes(1)
    await promise
  })

  it('falls back to webgl2 and re-attaches when the webgpu attach throws', async () => {
    const { attachWithBackendFallback } = await loadBackend()
    const attachToCanvas = vi
      .fn()
      .mockRejectedValueOnce(new Error('createBindGroup ... Required member is undefined'))
      .mockResolvedValueOnce(undefined)
    const nv: any = { opts: {}, attachToCanvas }
    const used = await attachWithBackendFallback(nv, {} as HTMLCanvasElement)
    expect(used).toBe('webgl2')
    expect(nv.opts.backend).toBe('webgl2')
    expect(attachToCanvas).toHaveBeenCalledTimes(2)
  })

  it('does not retry when already pinned to webgl2', async () => {
    vi.stubGlobal('location', { search: '?backend=webgl2' })
    const { attachWithBackendFallback } = await loadBackend()
    const attachToCanvas = vi.fn().mockRejectedValue(new Error('webgl2 context lost'))
    const nv: any = { opts: {}, attachToCanvas }
    await expect(attachWithBackendFallback(nv, {} as HTMLCanvasElement)).rejects.toThrow(
      'webgl2 context lost',
    )
    expect(attachToCanvas).toHaveBeenCalledTimes(1)
  })

  it('honors ?backend=webgl2', async () => {
    vi.stubGlobal('location', { search: '?backend=webgl2' })
    const { attachWithBackendFallback } = await loadBackend()
    const nv: any = { opts: {}, attachToCanvas: vi.fn().mockResolvedValue(undefined) }
    expect(await attachWithBackendFallback(nv, {} as HTMLCanvasElement)).toBe('webgl2')
    expect(nv.opts.backend).toBe('webgl2')
  })

  it('honors ?backend=webgpu', async () => {
    vi.stubGlobal('location', { search: '?backend=webgpu' })
    const { attachWithBackendFallback } = await loadBackend()
    const nv: any = { opts: {}, attachToCanvas: vi.fn().mockResolvedValue(undefined) }
    expect(await attachWithBackendFallback(nv, {} as HTMLCanvasElement)).toBe('webgpu')
    expect(nv.opts.backend).toBe('webgpu')
  })

  it('ignores an unrecognised ?backend= value', async () => {
    vi.stubGlobal('location', { search: '?backend=vulkan' })
    const { attachWithBackendFallback } = await loadBackend()
    const nv: any = { opts: {}, attachToCanvas: vi.fn().mockResolvedValue(undefined) }
    await attachWithBackendFallback(nv, {} as HTMLCanvasElement)
    expect(nv.opts.backend).toBeUndefined()
  })
})
