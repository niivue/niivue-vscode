import './AboutDialog.css'
import './CiteDialog.css'
import { type Signal, effect, useSignal } from '@preact/signals'
import { useRef } from 'preact/hooks'
import { CITATION_BIBTEX, CITATION_DOI_URL, CITATION_TEXT } from '../citation'

/**
 * Copy text to the clipboard. The Clipboard API can be blocked in embedded
 * frames (JupyterLab), so a selected textarea inside `container` is the
 * fallback; it has to be inside the modal dialog to be selectable.
 */
async function copyText(text: string, container: HTMLElement | null): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Selecting moves focus to the textarea; it goes back to the button.
    const focused = document.activeElement as HTMLElement | null
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.className = 'nv-cite-copy-source'
    ;(container ?? document.body).appendChild(area)
    try {
      area.select()
      return document.execCommand('copy')
    } finally {
      area.remove()
      focused?.focus()
    }
  }
}

/**
 * The brand menu's "Cite NiiVue" dialog: the reference for the NiiVue wrapper
 * ecosystem paper, with buttons to copy it as text or BibTeX. `isOpen` is a
 * trigger signal like AboutDialog's.
 */
export const CiteDialog = ({ isOpen }: { isOpen: Signal<boolean> }) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const copied = useSignal<'text' | 'bibtex' | null>(null)

  effect(() => {
    if (isOpen.value) {
      copied.value = null
      dialogRef.current?.showModal()
      isOpen.value = false
    }
  })

  const copy = async (kind: 'text' | 'bibtex') => {
    const text = kind === 'text' ? `${CITATION_TEXT} ${CITATION_DOI_URL}` : CITATION_BIBTEX
    if (await copyText(text, dialogRef.current)) {
      copied.value = kind
    }
  }

  return (
    <dialog ref={dialogRef} className="nv-about" data-testid="cite-dialog">
      <form method="dialog" className="nv-about-body">
        <h2 className="nv-about-title">Cite NiiVue</h2>
        <p className="nv-about-text">If you use NiiVue Viewer in published work, please cite:</p>
        <p className="nv-cite-reference" data-testid="cite-reference">
          {CITATION_TEXT}{' '}
          <a
            className="nv-about-link"
            href={CITATION_DOI_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            {CITATION_DOI_URL.replace('https://doi.org/', 'doi:')}
          </a>
        </p>
        <div className="nv-cite-actions">
          <button type="button" className="nv-about-close" onClick={() => copy('text')}>
            {copied.value === 'text' ? 'Copied' : 'Copy citation'}
          </button>
          <button type="button" className="nv-about-close" onClick={() => copy('bibtex')}>
            {copied.value === 'bibtex' ? 'Copied' : 'Copy BibTeX'}
          </button>
          <button className="nv-about-close" value="close">
            Close
          </button>
        </div>
      </form>
    </dialog>
  )
}
