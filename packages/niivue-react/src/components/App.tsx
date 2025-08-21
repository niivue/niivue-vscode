import { useEffect } from 'preact/hooks'
import { AppProps } from './AppProps'
import { Container } from './Container'
import { ImageDrop } from './ImageDrop'
import { Menu } from './Menu'

export const App = ({ appProps }: { appProps: AppProps }) => {
  useEffect(() => {
    // Signal that the app is ready
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
