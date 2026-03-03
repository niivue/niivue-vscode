import { NVImage } from '@niivue/niivue'
import { Signal, useSignal } from '@preact/signals'
import { useRef } from 'preact/hooks'
import { ExtendedNiivue } from '../events'
import { runNiimath } from '../niimath'

interface NiimathPanelProps {
  nvArray: Signal<ExtendedNiivue[]>
  visible: Signal<boolean>
}

export const NiimathPanel = ({ nvArray, visible }: NiimathPanelProps) => {
  if (!visible.value) return null

  const commandRef = useRef<HTMLTextAreaElement | null>(null)
  const status = useSignal<'idle' | 'running' | 'done' | 'error'>('idle')
  const errorMsg = useSignal('')
  const resultBlob = useSignal<Blob | null>(null)

  const inputName = nvArray.value[0]?.volumes?.[0]
    ? nvArray.value[0].uri || 'input.nii'
    : ''

  const handleRun = async () => {
    const nv = nvArray.value[0]
    if (!nv?.volumes?.[0]) {
      errorMsg.value = 'No image loaded'
      status.value = 'error'
      return
    }
    const cmd = commandRef.current?.value?.trim()
    if (!cmd) {
      errorMsg.value = 'Enter a niimath command'
      status.value = 'error'
      return
    }

    status.value = 'running'
    errorMsg.value = ''
    resultBlob.value = null

    try {
      const volume = nv.volumes[0]
      const uint8 = await volume.saveToUint8Array(inputName)
      const fileName = inputName.endsWith('.nii') || inputName.endsWith('.nii.gz') ? inputName : 'input.nii'
      const file = new File([new Uint8Array(uint8)], fileName)
      const blob = await runNiimath(file, cmd)
      resultBlob.value = blob
      status.value = 'done'
    } catch (e: any) {
      errorMsg.value = e.message || 'Niimath processing failed'
      status.value = 'error'
    }
  }

  const handleLoadResult = async () => {
    if (!resultBlob.value || !nvArray.value[0]) return
    const nv = nvArray.value[0]
    const data = await resultBlob.value.arrayBuffer()
    const image = await NVImage.loadFromUrl({
      url: data,
      name: 'niimath_output.nii',
      colormap: 'redyell',
      opacity: 0.5,
    })
    nv.addVolume(image)
    nv.updateGLVolume()
    nvArray.value = [...nvArray.value]
  }

  const handleSave = () => {
    if (!resultBlob.value) return
    const url = URL.createObjectURL(resultBlob.value)
    const a = document.createElement('a')
    a.href = url
    a.download = 'niimath_output.nii'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="absolute left-8 top-8 bg-gray-500 rounded-md z-50 p-2 space-y-2 min-w-[320px]">
      <div className="flex items-center justify-between">
        <span className="font-bold text-sm">Niimath</span>
        <button
          className="bg-gray-600 border-2 border-gray-600 rounded-md w-16 text-sm"
          onClick={() => (visible.value = false)}
        >
          Close
        </button>
      </div>
      <div className="text-xs">
        <span className="text-gray-300">Input: </span>
        <span className="font-mono">{inputName || 'No image loaded'}</span>
      </div>
      <textarea
        ref={commandRef}
        className="w-full h-20 bg-gray-700 text-gray-100 font-mono text-sm p-1 rounded border border-gray-600 resize-y"
        placeholder="e.g. -add 5 -mul 2 -thr 100"
        spellcheck={false}
      />
      <div className="flex items-center gap-2">
        <button
          className="bg-green-700 hover:bg-green-600 border-2 border-green-800 rounded-md px-3 py-0.5 text-sm flex items-center gap-1"
          onClick={handleRun}
          disabled={status.value === 'running'}
        >
          <span>▶</span> Run
        </button>
        {status.value === 'running' && <span className="text-yellow-300 text-xs">Processing…</span>}
        {status.value === 'done' && <span className="text-green-300 text-xs">Done</span>}
        {status.value === 'error' && (
          <span className="text-red-300 text-xs">{errorMsg.value}</span>
        )}
      </div>
      {resultBlob.value && (
        <div className="flex gap-2">
          <button
            className="bg-blue-700 hover:bg-blue-600 border-2 border-blue-800 rounded-md px-3 py-0.5 text-sm"
            onClick={handleLoadResult}
          >
            Load as Overlay
          </button>
          <button
            className="bg-gray-600 hover:bg-gray-500 border-2 border-gray-700 rounded-md px-3 py-0.5 text-sm"
            onClick={handleSave}
          >
            Save to Disk
          </button>
        </div>
      )}
    </div>
  )
}
