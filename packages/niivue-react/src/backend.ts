import type { BackendType } from '@niivue/niivue'
import type { ExtendedNiivue } from './events'

/**
 * WebGL2 escape hatch for the niivue v1 WebGPU migration.
 *
 * niivue only falls back to WebGL2 when `navigator.gpu` is absent, so a browser
 * that advertises WebGPU but cannot render still picks it and draws nothing.
 * `?backend=webgl2` forces the working backend on those machines.
 *
 * Falling back automatically is not possible from here: once the WebGPU context
 * exists, `getContext('webgl2')` on the same canvas returns null.
 */

/** `?backend=webgl2` or `?backend=webgpu` forces a backend (support / debugging). */
export function backendOverride(): BackendType | undefined {
  if (typeof location === 'undefined') {
    return undefined
  }
  const value = new URLSearchParams(location.search).get('backend')
  return value === 'webgl2' || value === 'webgpu' ? value : undefined
}

/**
 * Attach `nv` to `canvas`, honoring a `?backend=` override.
 *
 * Nothing may be awaited before `attachToCanvas`: attaching on the original tick
 * is what keeps niivue's canvas key handling working.
 */
export function attachWithBackend(
  nv: ExtendedNiivue,
  canvas: HTMLCanvasElement,
): ReturnType<ExtendedNiivue['attachToCanvas']> {
  const override = backendOverride()
  if (nv.opts && override) {
    nv.opts.backend = override
  }
  return nv.attachToCanvas(canvas)
}
