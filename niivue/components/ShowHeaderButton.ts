import { html } from 'htm/preact'
import { useRef, useState } from 'preact/hooks'

export const ShowHeaderButton = ({ info }) => {
  const dialog = useRef<HTMLDialogElement>()
  const [text, setText] = useState('Header')

  const headerButtonClick = () => {
    setText(info)
    dialog.current && dialog.current.showModal()
  }

  return html`
    <button onClick=${headerButtonClick}>Header</button>
    <dialog ref=${dialog}>
      <form>
        ${text.split('\n').map((line) => html` <p>${line}</p> `)}
        <button formmethod="dialog" value="cancel">Close</button>
      </form>
    </dialog>
  `
}
