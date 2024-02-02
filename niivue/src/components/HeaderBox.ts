import { useSignal } from '@preact/signals'
import { html } from 'htm/preact'
import { useEffect } from 'preact/hooks'
import { ExtendedNiivue } from '../events'

type HeaderInfo = {
  pixDims: [number, number, number, number]
  qoffset: [number, number, number]
}

export const HeaderBox = (props: any) => {
  const { nvArraySelected, nvArray, visible } = props
  if (visible && !visible.value) return html``

  const headerInfo = useSignal({ pixDims: [3, 1, 1, 1], qoffset: [0, 0, 0] } as HeaderInfo)

  useEffect(() => {
    if (nvArraySelected.value.length > 0) {
      const hdr = nvArraySelected.value[0].volumes[0].hdr
      headerInfo.value = {
        pixDims: [hdr.pixDims[0], hdr.pixDims[1], hdr.pixDims[2], hdr.pixDims[3]],
        qoffset: [hdr.qoffset_x, hdr.qoffset_y, hdr.qoffset_z],
      }
    }
  }, [nvArraySelected])

  const setVoxelSizeAndOrigin = () => {
    nvArraySelected.value.forEach((nv: ExtendedNiivue) => {
      nv.volumes.forEach((vol: any) => {
        vol.hdr.pixDims[1] = headerInfo.value.pixDims[1]
        vol.hdr.pixDims[2] = headerInfo.value.pixDims[2]
        vol.hdr.pixDims[3] = headerInfo.value.pixDims[3]
        vol.hdr.qoffset_x = headerInfo.value.qoffset[0]
        vol.hdr.qoffset_y = headerInfo.value.qoffset[1]
        vol.hdr.qoffset_z = headerInfo.value.qoffset[2]
        vol.calculateRAS()
      })
    })
    nvArray.value = [...nvArray.value]
  }
  return html`
    <div
      class="absolute grid grid-cols-2 left-80 top-12 bg-gray-500 rounded-md z-50 space-y-1 space-x-1 p-1"
    >
      <div>Size</div>
      <div>Origin</div>
      <div>
        <input
          class="bg-gray-600 w-16 border-2 border-gray-600 rounded-md"
          type="number"
          min="0"
          value=${headerInfo.value.pixDims[1]}
          onchange=${(e: any) => (headerInfo.value.pixDims[1] = parseFloat(e.target.value))}
        />
      </div>
      <div>
        <input
          class="bg-gray-600 w-16 border-2 border-gray-600 rounded-md"
          type="number"
          value=${headerInfo.value.qoffset[0]}
          onchange=${(e: any) => (headerInfo.value.qoffset[0] = parseFloat(e.target.value))}
        />
      </div>
      <div>
        <input
          class="bg-gray-600 w-16 border-2 border-gray-600 rounded-md"
          type="number"
          min="0"
          value=${headerInfo.value.pixDims[2]}
          onchange=${(e: any) => (headerInfo.value.pixDims[2] = parseFloat(e.target.value))}
        />
      </div>
      <div>
        <input
          class="bg-gray-600 w-16 border-2 border-gray-600 rounded-md"
          type="number"
          value=${headerInfo.value.qoffset[1]}
          onchange=${(e: any) => (headerInfo.value.qoffset[1] = parseFloat(e.target.value))}
        />
      </div>
      <div>
        <input
          class="bg-gray-600 w-16 border-2 border-gray-600 rounded-md"
          type="number"
          min="0"
          value=${headerInfo.value.pixDims[3]}
          onchange=${(e: any) => (headerInfo.value.pixDims[3] = parseFloat(e.target.value))}
        />
      </div>
      <div>
        <input
          class="bg-gray-600 w-16 border-2 border-gray-600 rounded-md"
          type="number"
          value=${headerInfo.value.qoffset[2]}
          onchange=${(e: any) => (headerInfo.value.qoffset[2] = parseFloat(e.target.value))}
        />
      </div>
      <button
        class="bg-gray-600 border-2 border-gray-600 rounded-md w-16"
        onclick=${setVoxelSizeAndOrigin}
      >
        Set
      </button>
      <br />
      <button
        class="bg-gray-600 border-2 border-gray-600 rounded-md w-16"
        onclick=${() => (visible.value = false)}
      >
        Close
      </button>
    </div>
  `
}
