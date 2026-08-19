import type { BackendType } from '@niivue/niivue'
import type { ExtendedNiivue } from './events'

/**
 * WebGL2 fallback for the niivue v1 WebGPU migration.
 *
 * niivue v1 selects WebGPU whenever `navigator.gpu` exists, but that only proves
 * the API is present. A blocklisted or software adapter, a driver bug, or
 * exhausted limits still fail at the first render with `createBindGroup ...
 * Required member is undefined`, which shows up as a blank canvas in the PWA
 * while the WebGL2-backed VS Code webview draws the same files fine.
 *
 * We catch a failing WebGPU attach and re-attach on WebGL2. An earlier version
 * also probed `navigator.gpu` up front, but awaiting anything before
 * `attachToCanvas` delays it past the synchronous point niivue expects and
 * breaks canvas key handling (niivue-vscode#272, caught by
 * keyboard-shortcuts.spec.ts). Everything here therefore stays synchronous up to
 * the attach call.
 */

/** `?backend=webgl2` or `?backend=webgpu` forces a backend (support / debugging). */
function backendOverride(): BackendType | undefined {
  if (typeof location === 'undefined') {
    return undefined
  }
  const value = new URLSearchParams(location.search).get('backend')
  return value === 'webgl2' || value === 'webgpu' ? value : undefined
}

/**
 * Attach `nv` to `canvas`, falling back to WebGL2 if a WebGPU attach throws.
 * Returns the backend that ended up being used.
 *
 * Nothing may be awaited before `attachToCanvas`: an async function body runs
 * synchronously up to its first `await`, and that is what keeps the attach on
 * the same tick it was on before this module existed.
 */
export function attachWithBackendFallback(
  nv: ExtendedNiivue,
  canvas: HTMLCanvasElement,
): Promise<BackendType> {
  const override = backendOverride()
  if (nv.opts && override) {
    nv.opts.backend = override
  }
  return nv
    .attachToCanvas(canvas)
    .then((): BackendType => (nv.opts?.backend as BackendType) ?? 'webgpu')
    .catch(async (err: unknown): Promise<BackendType> => {
      if (nv.opts?.backend === 'webgl2') {
        throw err
      }
      console.warn('[niivue] WebGPU attach failed, falling back to WebGL2:', err)
      if (nv.opts) {
        nv.opts.backend = 'webgl2'
      }
      await nv.attachToCanvas(canvas)
      return 'webgl2'
    })
}
