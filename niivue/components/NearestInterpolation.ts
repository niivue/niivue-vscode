import { html } from 'htm/preact'
import { AppProps } from './App'

export const NearestInterpolation = ({ interpolation }: AppProps) => {
  const handleCheckboxChange = (event: Event) => {
    const target = event.target as HTMLInputElement
    interpolation.value = target.checked
  }

  return html`
    <label>
      <span>Interpolation</span>
      <input
        type="checkbox"
        checked=${interpolation.value}
        onchange=${handleCheckboxChange}
      />
    </label>
  `
}
