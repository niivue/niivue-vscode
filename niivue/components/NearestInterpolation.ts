import { html } from 'htm/preact'

interface NearestInterpolationProps {
  interpolation: boolean
  setInterpolation: Function
}

export const NearestInterpolation = ({
  interpolation,
  setInterpolation,
}: NearestInterpolationProps) => html`
  <label>
    <span>Interpolation</span>
    <input
      type="checkbox"
      checked=${interpolation}
      onchange=${(e: any) => setInterpolation(e.target.checked)}
    />
  </label>
`
