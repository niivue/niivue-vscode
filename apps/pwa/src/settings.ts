import { NiiVueSettings } from '@niivue/react'

export function getSettings(): NiiVueSettings {
  return {
    showCrosshairs: true,
    interpolation: true,
    colorbar: false,
    radiologicalConvention: false,
    zoomDragMode: false,
  }
}
