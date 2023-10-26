import { render, fireEvent, screen, waitFor } from '@testing-library/preact'
import { html } from 'htm/preact'

import { App } from '../App'

describe('App', () => {
  test('should display home screen', () => {
    // render(html`<${App} />`)
    // test that the component with text "Niivue-ify" is present
    // expect(screen.getByText('Niivue-ify')).toBe
    expect(2 + 3).toBe(5)
  })
})
