import type { BackendType } from '@niivue/niivue'
import type { ExtendedNiivue } from './events'

// NiiVue renders with WebGL2 unless asked for WebGPU, and falls back from WebGPU only
// when `navigator.gpu` is absent: a browser that advertises WebGPU but cannot render
// it draws nothing.

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
 * is what keeps NiiVue's canvas key handling working.
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
