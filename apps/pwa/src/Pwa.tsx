import { Container, ImageDrop, listenToMessages, Menu, type AppProps } from '@niivue/react'
import { computed } from '@preact/signals'
import { useEffect } from 'preact/hooks'
import { HomeScreen } from './components/HomeScreen'

export const Pwa = ({ appProps }: { appProps: AppProps }) => {
  const nImages = computed(() => appProps.nvArray.value.length)
  const showHomeScreen = computed(() => nImages.value == 0)

  useEffect(() => {
    listenToMessages(appProps)

    if ('launchQueue' in window) {
      const launchQueue = (window as any).launchQueue
      launchQueue.setConsumer(async (launchParams: any) => {
        if (!launchParams.files || launchParams.files.length === 0) {
          return
        }
        window.postMessage({
          type: 'initCanvas',
          body: { n: launchParams.files.length },
        })
        for (const fileHandle of launchParams.files) {
          const file = await fileHandle.getFile()
          const data = await file.arrayBuffer()
          window.postMessage({
            type: 'addImage',
            body: {
              data,
              uri: file.name,
            },
          })
        }
      })
    }

    document.dispatchEvent(new Event('AppReady'))
  }, [])

  return (
    <ImageDrop>
      <Menu {...appProps} />
      {showHomeScreen.value && <HomeScreen />}
      <Container {...appProps} />
      <div className="pl-2">{appProps.location?.value || '\u00A0'}</div>
    </ImageDrop>
  )
}
