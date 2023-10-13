import { Signal } from '@preact/signals'
import { html } from 'htm/preact'

export const NearestInterpolation = ({
  interpolation,
}: {
  interpolation: Signal<boolean>
}) => {
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
