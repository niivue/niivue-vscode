import { effect } from '@preact/signals'
import { useLayoutEffect, useMemo, useRef } from 'preact/hooks'

/**
 * Run `callback` as a signal effect while the component is mounted. Unlike
 * useSignalEffect, which defers re-runs to the next animation frame, it re-runs
 * synchronously when a signal it read changes.
 */
export function useImmediateSignalEffect(callback: () => void | (() => void)) {
  const latest = useRef(callback)
  latest.current = callback
  const dispose = useMemo(() => effect(() => latest.current()), [])
  // A layout effect is registered at commit, so an unmount before paint still disposes.
  useLayoutEffect(() => dispose, [dispose])
}
