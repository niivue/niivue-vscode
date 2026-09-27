import { effect } from '@preact/signals'
import { useEffect, useMemo, useRef } from 'preact/hooks'

/**
 * Run `callback` as a signal effect for as long as the component is mounted.
 *
 * Calling effect() in a component body starts another effect on every render
 * and never disposes of any of them, so each change runs the callback once per
 * past render. This hook starts one effect, during the first render as
 * effect() did, always runs the latest callback, and disposes of the effect
 * on unmount.
 *
 * Unlike useSignalEffect, which defers re-runs to the next animation frame,
 * the callback re-runs synchronously when a signal it read changes.
 */
export function useImmediateSignalEffect(callback: () => void | (() => void)) {
  const latest = useRef(callback)
  latest.current = callback
  const dispose = useMemo(() => effect(() => latest.current()), [])
  useEffect(() => dispose, [dispose])
}
