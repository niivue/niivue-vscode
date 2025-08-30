import { render } from '@testing-library/preact'
import { describe, expect, it } from 'vitest'
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
