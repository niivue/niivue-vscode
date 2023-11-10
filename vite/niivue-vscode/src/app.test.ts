// test if App renders
import { describe, expect, it, test } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/preact'
import { BrowserRouter } from 'react-router-dom'

import { html } from 'htm/preact'
import { sum, App } from './app'

test('adds 1 + 2 to equal 3', () => {
  expect(sum(1, 2)).toBe(3)
})

describe('Preact Demo Test Suite', () => {
  it('basic', () => {
    render(html`<${BrowserRouter}><${App} /></${BrowserRouter}>`)
    expect(
      screen.getByText(/Click on the Vite and Preact logos/i),
    ).toBeInTheDocument()
  })

  // it('click event', async () => {
  //   render(<BrowserRouter><App /></BrowserRouter>)
  //   fireEvent.click(screen.getByRole('button'))
  //   expect(await screen.findByText(/count is: 1/i)).toBeInTheDocument()
  // })
})
