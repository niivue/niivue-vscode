import { signal } from '@preact/signals'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { CiteDialog } from '../components/CiteDialog'

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn()
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('CiteDialog', () => {
  it('copies BibTeX through the Clipboard API', async () => {
    const writeText = vi.fn(async (_text: string) => {})
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    render(<CiteDialog isOpen={signal(true)} />)

    fireEvent.click(screen.getByRole('button', { name: 'Copy BibTeX', hidden: true }))

    await screen.findByRole('button', { name: 'Copied', hidden: true })
    expect(writeText.mock.calls[0][0]).toContain('doi     = {10.52294/001c.167815}')
  })

  it('falls back to a selection copy and gives focus back to the button', async () => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn(async () => Promise.reject(new Error('denied'))) },
    })
    // Like Chromium, selecting focuses the textarea.
    vi.spyOn(HTMLTextAreaElement.prototype, 'select').mockImplementation(function (
      this: HTMLTextAreaElement,
    ) {
      this.focus()
    })
    const execCommand = vi.fn(() => true)
    Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true })
    render(<CiteDialog isOpen={signal(true)} />)
    const button = screen.getByRole('button', { name: 'Copy citation', hidden: true })
    button.focus()

    fireEvent.click(button)

    await waitFor(() => expect(execCommand).toHaveBeenCalledWith('copy'))
    expect(document.activeElement).toBe(button)
    expect(document.querySelector('textarea')).toBeNull()
  })
})
