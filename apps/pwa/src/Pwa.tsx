import {
  Container,
  ImageDrop,
  listenToMessages,
  Menu,
  type AppProps,
} from '@niivue/react'
import { computed } from '@preact/signals'
import { useEffect } from 'preact/hooks'
import { HomeScreen } from './components/HomeScreen'

export const Pwa = ({ appProps }: { appProps: AppProps }) => {
  const nImages = computed(() => appProps.nvArray.value.length)
  const showHomeScreen = computed(() => nImages.value == 0)

  useEffect(() => {
    listenToMessages(appProps)
    document.dispatchEvent(new Event('AppReady'))
  }, [])

  return (
    <ImageDrop>
      <Menu {...appProps} />
      {showHomeScreen.value && <HomeScreen />}
      <Container {...appProps} />
      <div className="pl-2">{appProps.location}</div>
    </ImageDrop>
  )
}
