import { describe, expect, it } from 'vitest'
import { base64ToArrayBuffer } from '../src/utils'

describe('utils', () => {
  describe('base64ToArrayBuffer', () => {
    it('should decode valid base64 string', () => {
      const base64 = 'SGVsbG8gV29ybGQ=' // "Hello World"
      const result = base64ToArrayBuffer(base64)

      expect(result).toBeInstanceOf(ArrayBuffer)
      expect(result.byteLength).toBeGreaterThan(0)
    })

    it('should handle empty base64 string', () => {
      const result = base64ToArrayBuffer('')
      expect(result).toBeInstanceOf(ArrayBuffer)
      expect(result.byteLength).toBe(0)
    })

    it('should throw on invalid base64', () => {
      expect(() => {
        base64ToArrayBuffer('not-valid-base64!!!')
      }).toThrow()
    })

    it('should correctly decode known base64 string', () => {
      const base64 = 'SGVsbG8gV29ybGQ=' // "Hello World"
      const result = base64ToArrayBuffer(base64)
      const decoder = new TextDecoder()
      const text = decoder.decode(result)

      expect(text).toBe('Hello World')
    })
  })
})
