import { signal } from '@preact/signals'
import { cleanup, render, screen } from '@testing-library/preact'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { AboutDialog } from '../components/AboutDialog'

// jsdom doesn't implement showModal; the open effect just needs it to not throw.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn()
  HTMLDialogElement.prototype.close = vi.fn()
})

afterEach(() => cleanup())

const anchorIn = (testId: string) =>
  screen.getByTestId(testId).querySelector('a') as HTMLAnchorElement

describe('AboutDialog version line', () => {
  it('links the version to its commit and shows the build date when repoUrl is known', () => {
    render(
      <AboutDialog
        isOpen={signal(true)}
        appInfo={{
          version: 'abc1234',
          buildDate: '2026-06-19T00:00:00.000Z',
          repoUrl: 'https://github.com/niivue/niivue-vscode',
        }}
      />,
    )

    const link = anchorIn('about-version')
    expect(link.getAttribute('href')).toBe(
      'https://github.com/niivue/niivue-vscode/commit/abc1234',
    )
    expect(link.textContent).toContain('abc1234')
    expect(link.textContent).toContain('built')
  })

  it('falls back to the repo link (no commit, no date) when only a version is given', () => {
    render(<AboutDialog isOpen={signal(true)} appInfo={{ version: 'deadbee' }} />)

    const link = anchorIn('about-version')
    // No repoUrl -> can't build a commit URL, so it points at the default repo.
    expect(link.getAttribute('href')).toBe('https://github.com/niivue/niivue-vscode')
    expect(link.textContent).toContain('deadbee')
    expect(link.textContent).not.toContain('built')
  })

  it('omits the version line and uses the default GitHub link when no appInfo is supplied', () => {
    render(<AboutDialog isOpen={signal(true)} />)

    expect(screen.queryByTestId('about-version')).toBeNull()
    const source = screen.getByText('Source on GitHub') as HTMLAnchorElement
    expect(source.getAttribute('href')).toBe('https://github.com/niivue/niivue-vscode')
  })
})
