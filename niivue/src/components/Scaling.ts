import { html } from 'htm/preact'
import { useRef, useEffect } from 'preact/hooks'
import { ScalingOpts } from './App'

interface ScalingProps {
  setScaling: Function
  init: any
}

export const Scaling = ({ setScaling, init }: ScalingProps) => {
  const minRef = useRef<HTMLInputElement>()
  const maxRef = useRef<HTMLInputElement>()
  useEffect(() => {
    if (!minRef.current || !maxRef.current) {
      return
    }
    minRef.current.value = init.cal_min.toPrecision(2)
    maxRef.current.value = init.cal_max.toPrecision(2)
    const step = ((init.cal_max - init.cal_min) / 10).toPrecision(2)
    minRef.current.step = step
    maxRef.current.step = step
  }, [init])
  const update = () =>
    setScaling({
      isManual: true,
      min: parseFloat(minRef.current?.value ?? '0'),
      max: parseFloat(maxRef.current?.value ?? '1'),
    } as ScalingOpts)
  return html`
    <div clas="relative">
      <label class="items-baseline h-6 px-2">
        <span>Min </span>
        <input
          class="border-2 border-gray-600 rounded-md bg-gray-700 h-6 w-20"
          type="number"
          ref=${minRef}
          onchange=${update}
        />
      </label>
      <label class="items-baseline h-6 px-2">
        <span>Max </span>
        <input
          class="border-2 border-gray-600 rounded-md bg-gray-700 h-6 w-20"
          type="number"
          ref=${maxRef}
          onchange=${update}
        />
      </label>
    </div>
  `
}
