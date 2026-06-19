import type { ComponentChildren } from 'preact'
import { render } from '@testing-library/preact'
import { describe, expect, it, vi } from 'vitest'

// HomeScreen composes the shared HomeSection from @niivue/react. The PWA's
// vitest config resolves that package to its built dist, so stub it here to keep
// this unit test self-contained and independent of build order (mirrors the
// desktop home-screen test).
vi.mock('@niivue/react', () => ({
  HomeSection: ({ title, children }: { title: string; children: ComponentChildren }) => (
    <section>
      <h2>{title}</h2>
      <p>{children}</p>
    </section>
  ),
}))

import { HomeScreen } from '../src/components/HomeScreen'

describe('HomeScreen', () => {
  it('should render the bookmarklet link', () => {
    const { getByText } = render(<HomeScreen />)
    expect(getByText('Niivue-ify')).toBeInTheDocument()
  })

  it('should render the test link', () => {
    const { getByText } = render(<HomeScreen />)
    expect(getByText('MNI')).toBeInTheDocument()
  })
})
