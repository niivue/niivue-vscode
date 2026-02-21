import { useEffect, useRef, useState } from 'preact/hooks'
import { Signal } from '@preact/signals'

/**
 * Custom hook for managing local storage with signals
 */
export function useLocalStorage<T>(key: string, signal: Signal<T>) {
  const isInitialized = useRef(false)

  useEffect(() => {
    if (!isInitialized.current) {
      try {
        const stored = localStorage.getItem(key)
        if (stored) {
          signal.value = JSON.parse(stored)
        }
      } catch (error) {
        console.warn(`Failed to parse localStorage key "${key}":`, error)
      }
      isInitialized.current = true
    }
  }, [key])

  useEffect(() => {
    if (isInitialized.current) {
      try {
        localStorage.setItem(key, JSON.stringify(signal.value))
      } catch (error) {
        console.warn(`Failed to save to localStorage key "${key}":`, error)
      }
    }
  }, [key, signal.value])

  return signal
}

/**
 * Custom hook for debouncing values
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export * from './useKeyboardShortcuts'
