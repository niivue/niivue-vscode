import { describe, expect, it, vi } from 'vitest'
import { Disposable, disposeAll } from '../src/dispose'

/** Trivial stub matching vscode.Disposable's shape (just a `dispose()` method). */
function stub() {
  return { dispose: vi.fn() }
}

describe('disposeAll', () => {
  it('does nothing on an empty list', () => {
    const list: { dispose: () => void }[] = []
    expect(() => disposeAll(list)).not.toThrow()
    expect(list).toHaveLength(0)
  })

  it('disposes a single item and empties the array', () => {
    const a = stub()
    const list = [a]
    disposeAll(list)
    expect(a.dispose).toHaveBeenCalledTimes(1)
    expect(list).toHaveLength(0)
  })

  it('disposes multiple items in LIFO order', () => {
    const order: string[] = []
    const a = { dispose: () => order.push('a') }
    const b = { dispose: () => order.push('b') }
    const c = { dispose: () => order.push('c') }
    disposeAll([a, b, c])
    expect(order).toEqual(['c', 'b', 'a'])
  })

  it('skips entries whose item is null/undefined (pop returns nothing)', () => {
    // The implementation guards against falsy pop results — exercise that path.
    const a = stub()
    const list = [undefined as unknown as { dispose: () => void }, a]
    expect(() => disposeAll(list)).not.toThrow()
    expect(a.dispose).toHaveBeenCalledOnce()
  })
})

// Minimal concrete subclass since `Disposable` is abstract.
class TestDisposable extends Disposable {
  registerNow<T extends { dispose: () => unknown }>(d: T): T {
    return this._register(d)
  }

  get disposed(): boolean {
    return this.isDisposed
  }
}

describe('Disposable', () => {
  it('starts not-disposed', () => {
    const d = new TestDisposable()
    expect(d.disposed).toBe(false)
  })

  it('disposes registered children when disposed', () => {
    const d = new TestDisposable()
    const child = stub()
    d.registerNow(child)
    d.dispose()
    expect(child.dispose).toHaveBeenCalledTimes(1)
    expect(d.disposed).toBe(true)
  })

  it('is idempotent: dispose() twice still disposes children only once', () => {
    const d = new TestDisposable()
    const child = stub()
    d.registerNow(child)
    d.dispose()
    d.dispose()
    expect(child.dispose).toHaveBeenCalledTimes(1)
  })

  it('immediately disposes anything registered after dispose() (no leak)', () => {
    const d = new TestDisposable()
    d.dispose()
    const child = stub()
    d.registerNow(child)
    expect(child.dispose).toHaveBeenCalledTimes(1)
  })

  it('disposes children in LIFO order (matches disposeAll semantics)', () => {
    const d = new TestDisposable()
    const order: string[] = []
    d.registerNow({ dispose: () => order.push('a') })
    d.registerNow({ dispose: () => order.push('b') })
    d.registerNow({ dispose: () => order.push('c') })
    d.dispose()
    expect(order).toEqual(['c', 'b', 'a'])
  })
})
