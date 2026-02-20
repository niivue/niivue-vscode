import { describe, expect, it } from 'vitest'
import { VIEW_MODE_TO_SLICE_TYPE } from '../src/types'
import { SLICE_TYPE } from '@niivue/niivue'

describe('UnstyledCanvas types', () => {
  it('should map view modes to slice types correctly', () => {
    expect(VIEW_MODE_TO_SLICE_TYPE.axial).toBe(SLICE_TYPE.AXIAL)
    expect(VIEW_MODE_TO_SLICE_TYPE.coronal).toBe(SLICE_TYPE.CORONAL)
    expect(VIEW_MODE_TO_SLICE_TYPE.sagittal).toBe(SLICE_TYPE.SAGITTAL)
    expect(VIEW_MODE_TO_SLICE_TYPE['3d']).toBe(SLICE_TYPE.RENDER)
    expect(VIEW_MODE_TO_SLICE_TYPE.multiplanar).toBe(SLICE_TYPE.MULTIPLANAR)
  })
})
