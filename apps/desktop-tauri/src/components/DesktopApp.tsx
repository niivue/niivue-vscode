import { Container, ImageDrop, Menu, listenToMessages, type AppProps } from '@niivue/react'
import { computed } from '@preact/signals'
import { useEffect } from 'preact/hooks'
import { isTauri, readFileBytes } from '../tauri-bridge'
import { addRecentFile } from '../recent-files'
import { DesktopHomeScreen } from './DesktopHomeScreen'

export const DesktopApp = ({ appProps }: { appProps: AppProps }) => {
  const nImages = computed(() => appProps.nvArray.value.length)
  const showHomeScreen = computed(() => nImages.value === 0)

  useEffect(() => {
    listenToMessages(appProps)
    setupTauriFileHandler(appProps)
    document.dispatchEvent(new Event('AppReady'))
  }, [])

  return (
    <ImageDrop>
      <Menu {...appProps} />
      {showHomeScreen.value && <DesktopHomeScreen appProps={appProps} />}
      <Container {...appProps} />
      {appProps.hideUI.value > 0 && (
        <div className="pl-2">{appProps.location?.value || '\u00A0'}</div>
      )}
    </ImageDrop>
  )
}

/**
 * When running inside Tauri, listen for file-open events from the Rust side
 * and load images using the native file bridge.
 */
function setupTauriFileHandler(appProps: AppProps) {
  if (!isTauri()) {
    return
  }

  // Listen for custom events from the native menu or CLI args
  window.addEventListener('tauri-open-file', async (event: Event) => {
    const customEvent = event as CustomEvent<{ path: string; name: string }>
    const { path, name } = customEvent.detail
    await loadFileFromPath(appProps, path, name)
  })
}

/**
 * Load a local file into NiiVue via the Tauri bridge.
 * This reads raw bytes from the filesystem and posts them
 * to the NiiVue message handler.
 */
export async function loadFileFromPath(
  appProps: AppProps,
  filePath: string,
  fileName: string,
): Promise<void> {
  const data = await readFileBytes(filePath)
  // Track in recent files
  addRecentFile(filePath, fileName).catch(console.error)
  // Post the image data to NiiVue
  window.postMessage({
    type: 'addImage',
    body: {
      data: data.buffer,
      uri: fileName,
    },
  })
  // Ensure at least one canvas exists
  if (appProps.nvArray.value.length === 0) {
    window.postMessage({
      type: 'initCanvas',
      body: { n: 1 },
    })
  }
}
