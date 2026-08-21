import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * `?backend=` override. Each test re-imports the module and stubs `location`
 * per scenario.
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

describe('attachWithBackend', () => {
  it('leaves opts.backend to niivue when no override is given', async () => {
    const { attachWithBackend } = await loadBackend()
    const nv: any = { opts: {}, attachToCanvas: vi.fn().mockResolvedValue(undefined) }
    await attachWithBackend(nv, {} as HTMLCanvasElement)
    expect(nv.opts.backend).toBeUndefined()
    expect(nv.attachToCanvas).toHaveBeenCalledTimes(1)
  })

  it('calls attachToCanvas synchronously, before any await', async () => {
    // Regression guard for #272: delaying the attach past its original tick
    // breaks niivue's canvas key handling.
    const { attachWithBackend } = await loadBackend()
    const attachToCanvas = vi.fn().mockResolvedValue(undefined)
    const nv: any = { opts: {}, attachToCanvas }
    const promise = attachWithBackend(nv, {} as HTMLCanvasElement)
    expect(attachToCanvas).toHaveBeenCalledTimes(1)
    await promise
  })

  it('honors ?backend=webgl2', async () => {
    vi.stubGlobal('location', { search: '?backend=webgl2' })
    const { attachWithBackend } = await loadBackend()
    const nv: any = { opts: {}, attachToCanvas: vi.fn().mockResolvedValue(undefined) }
    await attachWithBackend(nv, {} as HTMLCanvasElement)
    expect(nv.opts.backend).toBe('webgl2')
  })

  it('honors ?backend=webgpu', async () => {
    vi.stubGlobal('location', { search: '?backend=webgpu' })
    const { attachWithBackend } = await loadBackend()
    const nv: any = { opts: {}, attachToCanvas: vi.fn().mockResolvedValue(undefined) }
    await attachWithBackend(nv, {} as HTMLCanvasElement)
    expect(nv.opts.backend).toBe('webgpu')
  })

  it('ignores an unrecognised ?backend= value', async () => {
    vi.stubGlobal('location', { search: '?backend=vulkan' })
    const { attachWithBackend } = await loadBackend()
    const nv: any = { opts: {}, attachToCanvas: vi.fn().mockResolvedValue(undefined) }
    await attachWithBackend(nv, {} as HTMLCanvasElement)
    expect(nv.opts.backend).toBeUndefined()
  })

  it('propagates an attach failure without retrying', async () => {
    const { attachWithBackend } = await loadBackend()
    const attachToCanvas = vi
      .fn()
      .mockRejectedValue(new Error('createBindGroup ... Required member is undefined'))
    const nv: any = { opts: {}, attachToCanvas }
    await expect(attachWithBackend(nv, {} as HTMLCanvasElement)).rejects.toThrow('createBindGroup')
    expect(attachToCanvas).toHaveBeenCalledTimes(1)
  })
})
