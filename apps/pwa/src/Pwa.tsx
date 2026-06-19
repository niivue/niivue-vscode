import {
  Container,
  ImageDrop,
  Menu,
  createViewerClient,
  listenToMessages,
  type AppProps,
} from '@niivue/react'
import { computed } from '@preact/signals'
import { useEffect } from 'preact/hooks'
import { HomeScreen } from './components/HomeScreen'

// Build metadata for the brand menu's About dialog (injected by vite.config.ts).
const appInfo = {
  version: __GIT_HASH__,
  buildDate: __BUILD_DATE__,
  repoUrl: __GIT_REPO_URL__,
}

export const Pwa = ({ appProps }: { appProps: AppProps }) => {
  const nImages = computed(() => appProps.nvArray.value.length)
  const showHomeScreen = computed(() => nImages.value == 0)

  useEffect(() => {
    listenToMessages(appProps)
    // Expose appProps + the Viewer-Host Protocol client to window for E2E
    // testing and programmatic use. The UI's drop/menu paths share the same
    // message bus the client wraps.
    if (import.meta.env.DEV || (window as any).PLAYWRIGHT_TEST) {
      ;(window as any).appProps = appProps
      ;(window as any).viewerClient = createViewerClient(appProps)
    }

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
      <Menu {...appProps} appInfo={appInfo} />
      {showHomeScreen.value && <HomeScreen />}
      <Container {...appProps} />
      {appProps.hideUI.value > 0 && (
        <div className="pl-2">{appProps.location?.value || '\u00A0'}</div>
      )}
    </ImageDrop>
  )
}
