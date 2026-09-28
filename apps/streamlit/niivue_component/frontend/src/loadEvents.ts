export type LoadEventType = 'base_loaded' | 'fully_loaded'

export interface LoadState {
  /** The instance that received the current base image has finished loading it. */
  baseLoaded: boolean
  /** Every overlay and mesh the current arguments ask for has been started. */
  allStarted: boolean
}

/**
 * Decides when the base image, and then everything else requested for it, has
 * finished loading, and reports each moment once per load.
 *
 * `baseStarted` opens a new load. Overlay and mesh loads started for it go
 * through `track`. `check` is called after every render and whenever a tracked
 * load settles; it reads the current state from `getState`.
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

  check() {
    const { baseLoaded, allStarted } = this.getState()
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
