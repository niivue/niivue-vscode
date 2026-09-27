import { signal } from '@preact/signals'
import { cleanup, render } from '@testing-library/preact'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useImmediateSignalEffect } from '../hooks/useImmediateSignalEffect'

afterEach(() => cleanup())

function Probe({ source, onRun }: { source: { value: number }; onRun: (v: number) => void }) {
  useImmediateSignalEffect(() => onRun(source.value))
  return null
}

describe('useImmediateSignalEffect', () => {
  it('runs during the first render and synchronously on each change', () => {
    const source = signal(1)
    const onRun = vi.fn()
    render(<Probe source={source} onRun={onRun} />)
    expect(onRun.mock.calls).toEqual([[1]])

    source.value = 2
    expect(onRun.mock.calls).toEqual([[1], [2]])
  })

  it('keeps a single effect across re-renders and calls the latest callback', () => {
    const source = signal(1)
    const first = vi.fn()
    const latest = vi.fn()
    const { rerender } = render(<Probe source={source} onRun={first} />)
    for (let i = 0; i < 4; i++) {
      rerender(<Probe source={source} onRun={vi.fn()} />)
    }
    rerender(<Probe source={source} onRun={latest} />)

    source.value = 2
    expect(first).toHaveBeenCalledTimes(1)
    expect(latest.mock.calls).toEqual([[2]])
  })

  it('stops and runs the cleanup when the component unmounts', () => {
    const source = signal(1)
    const runs: number[] = []
    const cleanups: number[] = []
    function WithCleanup() {
      useImmediateSignalEffect(() => {
        const value = source.value
        runs.push(value)
        return () => cleanups.push(value)
      })
      return null
    }
    const { unmount } = render(<WithCleanup />)
    unmount()
    source.value = 2

    expect(runs).toEqual([1])
    expect(cleanups).toEqual([1])
  })
})
