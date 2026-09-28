import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LoadEventType, LoadState, LoadTracker } from '../src/loadEvents'

function deferred() {
  let resolve!: () => void
  let reject!: (error: Error) => void
  const promise = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

let state: LoadState
let events: LoadEventType[]
let tracker: LoadTracker

beforeEach(() => {
  state = { baseLoaded: false, allStarted: true }
  events = []
  tracker = new LoadTracker(
    () => state,
    (type) => events.push(type),
  )
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('LoadTracker', () => {
  it('reports nothing before a base image starts loading', () => {
    state.baseLoaded = true
    tracker.check()
    expect(events).toEqual([])
  })

  it('reports base_loaded, then fully_loaded when nothing else was requested', () => {
    tracker.baseStarted()
    tracker.check()
    expect(events).toEqual([])

    state.baseLoaded = true
    tracker.check()
    tracker.check()
    expect(events).toEqual(['base_loaded', 'fully_loaded'])
  })

  it('reports fully_loaded only after every tracked load settled', async () => {
    tracker.baseStarted()
    state.baseLoaded = true
    const overlays = [deferred(), deferred()]
    overlays.forEach((o) => tracker.track(o.promise))
    tracker.check()
    expect(events).toEqual(['base_loaded'])

    overlays[0].resolve()
    await flush()
    expect(events).toEqual(['base_loaded'])

    overlays[1].resolve()
    await flush()
    expect(events).toEqual(['base_loaded', 'fully_loaded'])
  })

  it('treats a failed load as finished', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    tracker.baseStarted()
    state.baseLoaded = true
    const overlay = deferred()
    tracker.track(overlay.promise)

    overlay.reject(new Error('bad file'))
    await flush()

    expect(events).toEqual(['base_loaded', 'fully_loaded'])
    expect(consoleError).toHaveBeenCalled()
  })

  it('waits until the requested loads have been started', async () => {
    tracker.baseStarted()
    state.baseLoaded = true
    state.allStarted = false // e.g. mesh overlays wait for their mesh
    const mesh = deferred()
    tracker.track(mesh.promise)
    mesh.resolve()
    await flush()
    expect(events).toEqual(['base_loaded'])

    state.allStarted = true
    tracker.check()
    expect(events).toEqual(['base_loaded', 'fully_loaded'])
  })

  it('reports fully_loaded again when overlays reload for the same image', async () => {
    tracker.baseStarted()
    state.baseLoaded = true
    tracker.check()
    const overlay = deferred()
    tracker.track(overlay.promise)
    overlay.resolve()
    await flush()

    expect(events).toEqual(['base_loaded', 'fully_loaded', 'fully_loaded'])
  })

  it('ignores loads of the previous image once a new one starts', async () => {
    tracker.baseStarted()
    state.baseLoaded = true
    const stale = deferred()
    tracker.track(stale.promise)
    tracker.check()
    expect(events).toEqual(['base_loaded'])

    tracker.baseStarted()
    state.baseLoaded = false
    const current = deferred()
    tracker.track(current.promise)
    stale.resolve()
    await flush()
    state.baseLoaded = true
    tracker.check()
    expect(events).toEqual(['base_loaded', 'base_loaded'])

    current.resolve()
    await flush()
    expect(events).toEqual(['base_loaded', 'base_loaded', 'fully_loaded'])
  })
})
