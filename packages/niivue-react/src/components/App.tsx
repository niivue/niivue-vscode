import { useEffect } from 'preact/hooks'
import { AppProps } from './AppProps'
import { Container } from './Container'
import { ImageDrop } from './ImageDrop'
import { Menu } from './Menu'
import { StatusBar } from './StatusBar'

export const App = ({ appProps }: { appProps: AppProps }) => {
  useEffect(() => {
    // Signal that the app is ready
    document.dispatchEvent(new Event('AppReady'))
  }, [])

  return (
    <ImageDrop>
      <Menu {...appProps} />
      <Container {...appProps} />
      <StatusBar {...appProps} />
    </ImageDrop>
  )
}
