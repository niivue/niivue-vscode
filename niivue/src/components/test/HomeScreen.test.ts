import { describe, expect, it } from "vitest";
import { render } from "@testing-library/preact";
import { html } from "htm/preact";
import { HomeScreen } from "../HomeScreen";

describe('HomeScreen', () => {
  it('should render the bookmarklet link', () => {
    const { getByText } = render(html`<${HomeScreen} />`)
    expect(getByText('Niivue-ify')).toBeInTheDocument()
  })

  it('should render the test link', () => {
    const { getByText } = render(html`<${HomeScreen} />`)
    expect(getByText('MNI')).toBeInTheDocument()
  })
})
