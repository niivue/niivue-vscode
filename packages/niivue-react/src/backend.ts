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

/**
 * `pin` says whether we must write `opts.backend`. Only a genuine disagreement
 * with niivue earns that: a device that advertises WebGPU but cannot use it, or
 * an explicit override. When there is no `navigator.gpu` at all niivue already
 * picks WebGL2, and pinning it there changes its init path for no benefit.
 */
type Probe = { backend: BackendType; pin: boolean }

let probe: Promise<Probe> | undefined

function resolveProbe(): Promise<Probe> {
  if (!probe) {
    probe = detectBackend()
  }
  return probe
}

/** Resolve the backend once per session; cached for every canvas that attaches. */
export async function preferredBackend(): Promise<BackendType> {
  return (await resolveProbe()).backend
}

async function detectBackend(): Promise<Probe> {
  const override = backendOverride()
  if (override) {
    return { backend: override, pin: true }
  }
  const gpu =
    typeof navigator !== 'undefined' ? (navigator as unknown as { gpu?: GpuLike }).gpu : undefined
  if (!gpu) {
    return { backend: 'webgl2', pin: false }
  }
  try {
    const adapter = await gpu.requestAdapter()
    if (!adapter) {
      return { backend: 'webgl2', pin: true }
    }
    const device = await adapter.requestDevice()
    if (!device) {
      return { backend: 'webgl2', pin: true }
    }
    // We only needed to confirm a usable device exists; release this throwaway.
    device.destroy?.()
    return { backend: 'webgpu', pin: false }
  } catch {
    return { backend: 'webgl2', pin: true }
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
  const { backend, pin } = await resolveProbe()
  if (nv.opts && pin) {
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
    probe = Promise.resolve({ backend: 'webgl2', pin: true }) // later canvases skip WebGPU too
    if (nv.opts) {
      nv.opts.backend = 'webgl2'
    }
    await nv.attachToCanvas(canvas)
    return 'webgl2'
  }
}
