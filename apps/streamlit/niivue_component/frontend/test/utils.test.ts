import { describe, expect, it } from 'vitest'
import { decodeBase64ToArrayBuffer, createOverlayVolume } from '../src/utils'

describe('utils', () => {
  describe('decodeBase64ToArrayBuffer', () => {
    it('should decode valid base64 string', () => {
      const base64 = 'SGVsbG8gV29ybGQ=' // "Hello World"
      const result = decodeBase64ToArrayBuffer(base64)

      expect(result).toBeInstanceOf(ArrayBuffer)
      expect(result.byteLength).toBeGreaterThan(0)
    })

    it('should handle empty base64 string', () => {
      const result = decodeBase64ToArrayBuffer('')
      expect(result).toBeInstanceOf(ArrayBuffer)
      expect(result.byteLength).toBe(0)
    })

    it('should throw on invalid base64', () => {
      expect(() => {
        decodeBase64ToArrayBuffer('not-valid-base64!!!')
      }).toThrow()
    })
  })

  describe('createOverlayVolume', () => {
    it('should create overlay with default values', () => {
      const overlay = createOverlayVolume('base64data', 'overlay.nii')

      expect(overlay).toMatchObject({
        data: expect.any(ArrayBuffer),
        uri: 'overlay.nii',
        colormap: 'red',
        opacity: 0.5,
      })
    })

    it('should use custom colormap and opacity', () => {
      const overlay = createOverlayVolume('base64data', 'mask.nii', 'blue', 0.8)

      expect(overlay.colormap).toBe('blue')
      expect(overlay.opacity).toBe(0.8)
    })

    it('should handle empty data', () => {
      const overlay = createOverlayVolume('', 'empty.nii')
      expect(overlay.data.byteLength).toBe(0)
    })
  })
})
