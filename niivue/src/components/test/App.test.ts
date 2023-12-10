import { describe, expect, it, test } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/preact'
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

  it('should display home screen', () => {
    render(html`<${App} />`)

    expect(screen.getByText(/Home/i)).toBeInTheDocument()
    expect(screen.getByText(/Add Image/i)).toBeInTheDocument()
    expect(screen.getByText(/View/i)).toBeInTheDocument()
    expect(screen.getByText(/Bookmarklet/i)).toBeInTheDocument()
    expect(screen.getByText(/Drop Files to load images/i)).toBeInTheDocument()
  })

  it('should load a test image', () => {
    render(html`<${App} />`)
    const testLink = 'https://niivue.github.io/niivue-demo-images/mni152.nii.gz'
    // send a message to load the test image
    // window.postMessage(
    //   {
    //     type: 'addImage',
    //     body: {
    //       data: '',
    //       uri: testLink,
    //     },
    //   },
    //   '*',
    // )

    const addImageDropdown = screen.getByTestId('menu-item-dropdown-Add Image')
    fireEvent.click(addImageDropdown)
    const openExampleImage = screen.getByText(/Example Image/i)
    expect(openExampleImage).toBeInTheDocument()

    // fireEvent.click(openExampleImage)

    // expect(screen.getByText(/Loading/i)).toBeInTheDocument()
  })
})
