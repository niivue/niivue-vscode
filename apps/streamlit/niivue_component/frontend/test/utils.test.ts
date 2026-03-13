import { describe, expect, it, vi } from 'vitest'
import { base64ToArrayBuffer, throttle } from '../src/utils'

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

  describe('throttle', () => {
    it('should fire immediately on first call (leading edge)', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      throttled('a')
      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith('a')

      throttled.cancel()
    })

    it('should suppress rapid calls within the interval', () => {
      vi.useFakeTimers()
      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      throttled('a')
      throttled('b')
      throttled('c')

      // Only the first (leading) call should have fired
      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith('a')

      throttled.cancel()
      vi.useRealTimers()
    })

    it('should fire trailing edge with most recent args after interval', () => {
      vi.useFakeTimers()
      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      throttled('a') // fires immediately (leading)
      throttled('b') // suppressed, queued
      throttled('c') // suppressed, replaces 'b' as pending

      expect(fn).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(100)
      // Trailing edge fires with most recent args
      expect(fn).toHaveBeenCalledTimes(2)
      expect(fn).toHaveBeenLastCalledWith('c')

      throttled.cancel()
      vi.useRealTimers()
    })

    it('should allow calls after the interval has elapsed', () => {
      vi.useFakeTimers()
      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      throttled('a') // fires immediately
      vi.advanceTimersByTime(100)
      throttled('b') // fires immediately (interval elapsed)

      expect(fn).toHaveBeenCalledTimes(2)
      expect(fn).toHaveBeenLastCalledWith('b')

      throttled.cancel()
      vi.useRealTimers()
    })

    it('should cancel pending trailing call', () => {
      vi.useFakeTimers()
      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      throttled('a') // fires immediately
      throttled('b') // queued for trailing edge

      throttled.cancel()
      vi.advanceTimersByTime(200)

      // Only the leading call should have fired
      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith('a')

      vi.useRealTimers()
    })
  })
})
