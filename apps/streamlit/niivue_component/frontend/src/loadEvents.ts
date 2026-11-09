export type LoadEventType = 'base_loaded' | 'fully_loaded' | 'load_error'

export interface LoadState {
  /** The instance that received the current base image has finished loading it. */
  baseLoaded: boolean
  /** Loading the current base image failed. */
  baseFailed: boolean
  /** Every overlay and mesh the current arguments ask for has been started. */
  allStarted: boolean
}

/**
 * Reports once per base image when it has loaded or failed, and then when every
 * overlay and mesh load passed to `track` for it has settled.
 */
export class LoadTracker {
  private generation = 0
  private pending = 0
  private awaitingBase = false
  private awaitingAll = false

  constructor(
    private readonly getState: () => LoadState,
    private readonly emit: (type: LoadEventType) => void,
  ) {}

  /** A new base image started loading. */
  baseStarted() {
    // Loads of the previous image that settle later no longer count.
    this.generation++
    this.pending = 0
    this.awaitingBase = true
    this.awaitingAll = true
  }

  /**
   * Follow an overlay or mesh load. A load that fails still counts as finished:
   * the viewer then shows everything it could load.
   */
  track(load: Promise<unknown>) {
    const generation = this.generation
    this.pending++
    this.awaitingAll = true
    const settle = () => {
      if (generation === this.generation) {
        this.pending--
        this.check()
      }
    }
    load.then(settle, (error) => {
      console.error('Failed to load an overlay or mesh:', error)
      settle()
    })
  }

  /** Stop reporting, also for loads that settle later. */
  dispose() {
    this.generation++
    this.awaitingBase = false
    this.awaitingAll = false
  }

  check() {
    const { baseLoaded, baseFailed, allStarted } = this.getState()
    if (this.awaitingBase && baseFailed) {
      this.awaitingBase = false
      this.awaitingAll = false
      this.emit('load_error')
      return
    }
    if (this.awaitingBase && baseLoaded) {
      this.awaitingBase = false
      this.emit('base_loaded')
    }
    if (this.awaitingAll && !this.awaitingBase && this.pending === 0 && allStarted) {
      this.awaitingAll = false
      this.emit('fully_loaded')
    }
  }
}
