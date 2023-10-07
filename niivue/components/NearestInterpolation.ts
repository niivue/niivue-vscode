import { html } from 'htm/preact'

export const NearestInterpolation = ({
  interpolation,
  setInterpolation,
}) => html`
  <label>
    <span>Interpolation</span>
    <input
      type="checkbox"
      checked=${interpolation}
      onchange=${(e) => setInterpolation(e.target.checked)}
    />
  </label>
`
