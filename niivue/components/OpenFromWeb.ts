import { html } from 'htm/preact'
import { useRef } from 'preact/hooks'

export const OpenFromWeb = () => {
  const inputRef = useRef<HTMLInputElement>()
  const openImage = (uri: string) => {
    window.postMessage({
      type: 'addImage',
      body: {
        data: '',
        uri: uri,
      },
    })
  }
  const handleClick = () => {
    openImage(inputRef.current!.value)
  }

  return html`
    <div class="open-from-web">
      <input ref=${inputRef} type="text" placeholder="URL" />
      <button onclick=${handleClick}>Open Image from URL</button>
      <button
        onclick=${() =>
          openImage(
            'https://niivue.github.io/niivue-demo-images/mni152.nii.gz'
          )}
      >
        Open Example Image
      </button>
    </div>
  `
}
