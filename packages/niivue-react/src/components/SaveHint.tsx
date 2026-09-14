import './SaveHint.css'
import { type Signal } from '@preact/signals'
import { useEffect } from 'preact/hooks'
import { CITATION_DOI_URL, CITATION_SHORT } from '../citation'

/** How long the hint stays up. */
export const SAVE_HINT_MS = 10000

/** A saved figure to report: where it went (a file name or path). */
export type SavedFigure = { location: string }

/**
 * A small, transient note after a screenshot is saved: where it went, and the
 * paper to cite if the figure is published. It does not block the viewer and
 * hides itself; each save sets a new object, which restarts the timer.
 */
export const SaveHint = ({ saved }: { saved: Signal<SavedFigure | null> }) => {
  const current = saved.value

  useEffect(() => {
    if (!current) {
      return
    }
    const timer = setTimeout(() => {
      if (saved.value === current) {
        saved.value = null
      }
    }, SAVE_HINT_MS)
    return () => clearTimeout(timer)
  }, [current])

  if (!current) {
    return null
  }
  return (
    <div className="nv-save-hint" role="status" data-testid="save-hint">
      <span>
        Saved <span className="nv-save-hint-file">{current.location}</span>. If you publish this
        figure, please cite{' '}
        <a
          className="nv-save-hint-link"
          href={CITATION_DOI_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          {CITATION_SHORT}
        </a>
        .
      </span>
      <button
        type="button"
        className="nv-save-hint-close"
        aria-label="Dismiss"
        onClick={() => (saved.value = null)}
      >
        ×
      </button>
    </div>
  )
}
