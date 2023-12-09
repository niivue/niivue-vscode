import { describe, expect, it, test } from 'vitest'
import { render, screen } from '@testing-library/preact'
import { BrowserRouter } from 'react-router-dom'
import { html } from 'htm/preact'

import { App } from '../App'

test('adds 1 + 2 to equal 3', () => {
  expect(1 + 2).toBe(3)
})

describe('app', () => {
  test('htm', () => {
    html`<div>hello</div>`
  })

  test('adds 1 + 2 to equal 3', () => {
    const expected = 3
    expect(1 + 2).toBe(expected)
  })

  test('should display home screen', () => {
    // const n = new Niivue()
    render(html`<${BrowserRouter}><${App} /></${BrowserRouter}>`)
    // App
    // test that the component with text "Niivue-ify" is present
    // expect(screen.getByText("Niivue-ify")).toBe;
    expect(3 + 2).toBe(5)
  })

  it('basic', () => {
    render(html`<${App} />`)
    expect(screen.getByText(/Niivue-ify/i)).toBeInTheDocument()
  })
})
