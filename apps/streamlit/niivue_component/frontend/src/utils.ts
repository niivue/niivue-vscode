export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary_string = window.atob(base64)
  const len = binary_string.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i)
  }
  return bytes.buffer
}

/**
 * Creates a throttled version of a function that fires at most once per interval.
 * Uses leading + trailing edge behavior:
 * - First call fires immediately
 * - Subsequent calls within the interval are queued
 * - When interval expires, the most recent queued call fires
 * This ensures responsive feedback during drag while limiting Streamlit round-trips.
 */
export function throttle<T extends (...args: any[]) => void>(
  fn: T,
  interval: number,
): T & { cancel: () => void } {
  let lastCallTime = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let lastArgs: Parameters<T> | null = null

  const throttled = ((...args: Parameters<T>) => {
    const now = Date.now()
    lastArgs = args

    if (now - lastCallTime >= interval) {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      lastCallTime = now
      fn(...args)
    } else if (!timeoutId) {
      timeoutId = setTimeout(
        () => {
          lastCallTime = Date.now()
          timeoutId = null
          if (lastArgs) {
            fn(...lastArgs)
            lastArgs = null
          }
        },
        interval - (now - lastCallTime),
      )
    }
  }) as T & { cancel: () => void }

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    lastArgs = null
  }

  return throttled
}
