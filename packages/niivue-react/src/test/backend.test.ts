import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Backend probe + WebGPU->WebGL2 fallback. The module caches its
 * probe in a module-level singleton, so each test resets modules and re-imports
 * to get a fresh cache, and stubs `navigator.gpu` / `location` per scenario.
 */

const workingGpu = {
  requestAdapter: async () => ({ requestDevice: async () => ({ destroy() {} }) }),
}

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

describe('preferredBackend', () => {
  it('returns webgl2 when navigator.gpu is absent', async () => {
    vi.stubGlobal('navigator', {})
    const { preferredBackend } = await loadBackend()
    expect(await preferredBackend()).toBe('webgl2')
  })

  it('returns webgpu when an adapter and device can be created', async () => {
    vi.stubGlobal('navigator', { gpu: workingGpu })
    const { preferredBackend } = await loadBackend()
    expect(await preferredBackend()).toBe('webgpu')
  })

  it('returns webgl2 when requestAdapter yields null', async () => {
    vi.stubGlobal('navigator', { gpu: { requestAdapter: async () => null } })
    const { preferredBackend } = await loadBackend()
    expect(await preferredBackend()).toBe('webgl2')
  })

  it('returns webgl2 when requestDevice throws', async () => {
    vi.stubGlobal('navigator', {
      gpu: {
        requestAdapter: async () => ({
          requestDevice: async () => {
            throw new Error('device lost')
          },
        }),
      },
    })
    const { preferredBackend } = await loadBackend()
    expect(await preferredBackend()).toBe('webgl2')
  })

  it('honors a ?backend=webgl2 override even with a working GPU', async () => {
    vi.stubGlobal('navigator', { gpu: workingGpu })
    vi.stubGlobal('location', { search: '?backend=webgl2' })
    const { preferredBackend } = await loadBackend()
    expect(await preferredBackend()).toBe('webgl2')
  })

  it('caches the probe across calls', async () => {
    const requestAdapter = vi.fn(workingGpu.requestAdapter)
    vi.stubGlobal('navigator', { gpu: { requestAdapter } })
    const { preferredBackend } = await loadBackend()
    await preferredBackend()
    await preferredBackend()
    expect(requestAdapter).toHaveBeenCalledTimes(1)
  })
})

describe('attachWithBackendFallback', () => {
  it('leaves opts.backend alone when the probe clears webgpu', async () => {
    // Demote-only: niivue's own selection is stricter than this probe, so a clean
    // probe must not pin 'webgpu' and override it.
    vi.stubGlobal('navigator', { gpu: workingGpu })
    const { attachWithBackendFallback } = await loadBackend()
    const nv: any = { opts: {}, attachToCanvas: vi.fn().mockResolvedValue(undefined) }
    const used = await attachWithBackendFallback(nv, {} as HTMLCanvasElement)
    expect(used).toBe('webgpu')
    expect(nv.opts.backend).toBeUndefined()
    expect(nv.attachToCanvas).toHaveBeenCalledTimes(1)
  })

  it('pins the backend when ?backend= forces one', async () => {
    vi.stubGlobal('navigator', { gpu: workingGpu })
    vi.stubGlobal('location', { search: '?backend=webgpu' })
    const { attachWithBackendFallback } = await loadBackend()
    const nv: any = { opts: {}, attachToCanvas: vi.fn().mockResolvedValue(undefined) }
    await attachWithBackendFallback(nv, {} as HTMLCanvasElement)
    expect(nv.opts.backend).toBe('webgpu')
  })

  it('falls back to webgl2 and re-attaches when the webgpu attach throws', async () => {
    vi.stubGlobal('navigator', { gpu: workingGpu })
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

  it('does not retry when already on webgl2', async () => {
    vi.stubGlobal('navigator', {}) // no gpu -> webgl2
    const { attachWithBackendFallback } = await loadBackend()
    const attachToCanvas = vi.fn().mockRejectedValue(new Error('webgl2 context lost'))
    const nv: any = { opts: {}, attachToCanvas }
    await expect(attachWithBackendFallback(nv, {} as HTMLCanvasElement)).rejects.toThrow(
      'webgl2 context lost',
    )
    expect(attachToCanvas).toHaveBeenCalledTimes(1)
  })
})
