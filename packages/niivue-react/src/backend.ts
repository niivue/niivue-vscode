import type { BackendType } from '@niivue/niivue'
import type { ExtendedNiivue } from './events'

/**
 * Render-backend selection for the niivue v1 WebGPU migration.
 *
 * niivue v1 defaults to WebGPU whenever `navigator.gpu` exists, but a browser
 * can advertise `navigator.gpu` and still fail to create a working device
 * (software / blocklisted adapter, driver bug, exhausted limits). niivue's own
 * guard only checks that `navigator.gpu` is *present*, so those browsers crash on
 * the first render with `createBindGroup ... Required member is undefined`
 * instead of degrading. Seen in the PWA on both .npy and .nii.gz while the
 * WebGL2-backed VS Code webview rendered the same files fine.
 *
 * Strategy: try WebGPU first (the faster v1 default), fall back to WebGL2 (the
 * universally supported backend) - never the other way around, since WebGL2
 * essentially always works and would never yield to WebGPU. Two layers:
 *   1. a probe that actually requests an adapter + device before committing, and
 *   2. a reactive catch around attach, in case the probe passes but init still
 *      throws (the bind-group failure happens during the first real render).
 * A `?backend=webgl2` / `?backend=webgpu` URL param forces a backend for support.
 */

// Minimal structural shape of the bits of the WebGPU API we touch, so this file
// does not depend on @webgpu/types being installed.
type GpuLike = {
  requestAdapter(): Promise<{
    requestDevice(): Promise<{ destroy?(): void } | null>
  } | null>
}

let probe: Promise<BackendType> | undefined

/** Resolve the backend once per session; cached for every canvas that attaches. */
export function preferredBackend(): Promise<BackendType> {
  if (!probe) {
    probe = detectBackend()
  }
  return probe
}

async function detectBackend(): Promise<BackendType> {
  const override = backendOverride()
  if (override) {
    return override
  }
  const gpu =
    typeof navigator !== 'undefined' ? (navigator as unknown as { gpu?: GpuLike }).gpu : undefined
  if (!gpu) {
    return 'webgl2'
  }
  try {
    const adapter = await gpu.requestAdapter()
    if (!adapter) {
      return 'webgl2'
    }
    const device = await adapter.requestDevice()
    if (!device) {
      return 'webgl2'
    }
    // We only needed to confirm a usable device exists; release this throwaway.
    device.destroy?.()
    return 'webgpu'
  } catch {
    return 'webgl2'
  }
}

/** `?backend=webgl2` or `?backend=webgpu` forces a backend (support / debugging). */
function backendOverride(): BackendType | undefined {
  if (typeof location === 'undefined') {
    return undefined
  }
  const value = new URLSearchParams(location.search).get('backend')
  return value === 'webgl2' || value === 'webgpu' ? value : undefined
}

/**
 * Attach `nv` to `canvas` on the probed backend, falling back to WebGL2 if a
 * WebGPU attach throws despite the probe passing. Returns the backend used.
 */
export async function attachWithBackendFallback(
  nv: ExtendedNiivue,
  canvas: HTMLCanvasElement,
): Promise<BackendType> {
  const backend = await preferredBackend()
  if (nv.opts) {
    nv.opts.backend = backend
  }
  try {
    await nv.attachToCanvas(canvas)
    return backend
  } catch (err) {
    if (backend !== 'webgpu') {
      throw err
    }
    console.warn('[niivue] WebGPU attach failed, falling back to WebGL2:', err)
    probe = Promise.resolve('webgl2') // every later canvas skips WebGPU too
    if (nv.opts) {
      nv.opts.backend = 'webgl2'
    }
    await nv.attachToCanvas(canvas)
    return 'webgl2'
  }
}
