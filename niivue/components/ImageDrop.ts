import { html } from 'htm/preact'

// create a element with the text "drop images here", where the user can drop files
export const ImageDrop = () => {
  const handleDragOver = (e: DragEvent) => {
    e.stopPropagation()
    e.preventDefault()
    e.dataTransfer!.dropEffect = 'copy'
  }

  const handleDrop = (e: DragEvent) => {
    if (e.dataTransfer) {
      const file = e.dataTransfer.files[0]
      const data = file.arrayBuffer()
      window.postMessage({
        type: 'addImage',
        body: {
          data,
          uri: file.name,
        },
      })
    }
  }

  // create a big area where the user can drop files
  return html`
    <div class="drop-area" ondragover=${handleDragOver} ondrop=${handleDrop}>
      <div class="drop-area-text">Drop images here</div>
    </div>
  `
}
