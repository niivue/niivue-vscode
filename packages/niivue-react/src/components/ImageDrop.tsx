import { useSignal } from '@preact/signals'
import { ComponentChildren } from 'preact'

export const ImageDrop = ({ children }: { children: ComponentChildren }) => {
  const isDrag = useSignal(false)

  const handleDragOver = (e: DragEvent) => {
    e.stopPropagation()
    e.preventDefault()
    e.dataTransfer!.dropEffect = 'link'
    isDrag.value = true
  }

  const handleDragLeave = () => {
    isDrag.value = false
  }

  const handleDrop = (e: DragEvent) => {
    isDrag.value = false
    e.stopPropagation()
    e.preventDefault()
    const files = e.dataTransfer!.files
    const fileArray = Array.from(files)
    window.postMessage({
      type: 'initCanvas',
      body: {
        n: fileArray.length,
      },
    })
    const readimages = async () => {
      for (const file of fileArray) {
        const buffer = await file.arrayBuffer()
        window.postMessage({
          type: 'addImage',
          body: {
            data: buffer,
            uri: file.name,
          },
        })
      }
    }
    readimages()
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
