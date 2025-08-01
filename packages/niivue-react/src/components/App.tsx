import { useEffect } from 'preact/hooks'
import { listenToMessages } from '../events'
import { AppProps } from './AppProps'
import { Container } from './Container'
import { ImageDrop } from './ImageDrop'
import { Menu } from './Menu'

export const App = ({ appProps }: { appProps: AppProps }) => {
  useEffect(() => {
    listenToMessages(appProps)
    document.dispatchEvent(new Event('AppReady'))
  }, [])

  return (
    <ImageDrop>
      <Menu {...appProps} />
      <Container {...appProps} />
      <div className="pl-2">{appProps.location}</div>
    </ImageDrop>
  )
}
