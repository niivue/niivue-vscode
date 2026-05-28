import { useSignal } from '@preact/signals'
import { ComponentChildren } from 'preact'
import { buildImageMessageBodies } from '../utility'

export const ImageDrop = ({ children }: { children: ComponentChildren }) => {
  const isDrag = useSignal(false)

  const handleDragOver = (e: DragEvent) => {
    // Only react to external file drags. Internal reorder drags carry the
    // custom MIME below and must pass through so per-Volume drop zones can
    // claim them.
    if (!e.dataTransfer?.types.includes('Files')) return
    e.stopPropagation()
    e.preventDefault()
    e.dataTransfer.dropEffect = 'link'
    isDrag.value = true
  }

  const handleDragLeave = () => {
    isDrag.value = false
  }

  const handleDrop = (e: DragEvent) => {
    if (!e.dataTransfer?.types.includes('Files')) return
    isDrag.value = false
    e.stopPropagation()
    e.preventDefault()
    const files = e.dataTransfer.files
    const fileArray = Array.from(files)
    if (e.shiftKey) {
      // shift+drop adds files as overlays to the last loaded canvas
      const readOverlays = async () => {
        for (const file of fileArray) {
          const buffer = await file.arrayBuffer()
          window.postMessage({
            type: 'overlay',
            body: {
              data: buffer,
              uri: file.name,
              index: -1,
            },
          })
        }
      }
      readOverlays()
    } else {
      const readimages = async () => {
        const bodies = await buildImageMessageBodies(fileArray)
        if (bodies.length === 0) return
        window.postMessage({
          type: 'initCanvas',
          body: { n: bodies.length },
        })
        for (const body of bodies) {
          window.postMessage({ type: 'addImage', body })
        }
      }
      readimages()
    }
  }

  return (
    <div
      className={`flex flex-col h-full ${isDrag.value ? 'bg-gray-700' : 'bg-gray-800'}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={handleDragLeave}
    >
      {children}
    </div>
  )
}
