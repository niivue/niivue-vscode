import { html } from 'htm/preact'
import { render } from '@testing-library/preact'
import '@testing-library/jest-dom'
import { HomeScreen } from '../HomeScreen'

describe('HomeScreen', () => {
  it('renders the OpenFromWeb component', () => {
    const { getByText } = render(html`<${HomeScreen} />`)
    expect(getByText('Open Image from URL')).toBeInTheDocument()
  })

  it('renders the bookmarklet link', () => {
    const { getByText } = render(html`<${HomeScreen} />`)
    expect(getByText('Niivue-ify')).toBeInTheDocument()
  })

  it('renders the test link', () => {
    const { getByText } = render(html`<${HomeScreen} />`)
    expect(getByText('MNI')).toBeInTheDocument()
  })
})
