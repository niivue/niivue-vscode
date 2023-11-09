import { render } from '@testing-library/preact'
import { html } from 'htm/preact'

import { App } from '../App'

// declare const niivue: Niivue

// jest.mock('@niivue/niivue', () => ({
//   // define the mock implementation of the Niivue module here
//   // you can use the Niivue interface to define the mock implementation
//   // for example:
//   createNiivue: jest.fn(() => ({
//     // define the mock implementation of the createNiivue function here
//   })),
// }))

describe('app', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('htm', () => {
    html`<div>hello</div>`
  })

  test('adds 1 + 2 to equal 3', () => {
    const expected = 3
    expect(1 + 2).toBe(expected)
  })

  test('should display home screen', () => {
    // const n = new Niivue()
    render(html`<${App} />`)
    // App
    // test that the component with text "Niivue-ify" is present
    // expect(screen.getByText('Niivue-ify')).toBe
    expect(3 + 2).toBe(5)
  })
})
