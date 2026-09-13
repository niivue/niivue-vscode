import {
  Container,
  ImageDrop,
  Menu,
  StatusBar,
  listenToMessages,
  setFileSaver,
  type AppProps,
} from '@niivue/react'
import { computed } from '@preact/signals'
import { message } from '@tauri-apps/plugin-dialog'
import { useEffect } from 'preact/hooks'
import { isTauri, readFileBytes, saveFileWithDialog } from '../tauri-bridge'
import { addRecentFile } from '../recent-files'
import { DesktopHomeScreen } from './DesktopHomeScreen'

export const DesktopApp = ({ appProps }: { appProps: AppProps }) => {
  const nImages = computed(() => appProps.nvArray.value.length)
  const showHomeScreen = computed(() => nImages.value === 0)

  useEffect(() => {
    listenToMessages(appProps)
    if (isTauri()) {
      setFileSaver(saveWithNativeDialog)
    }
    document.dispatchEvent(new Event('AppReady'))
  }, [])

  return (
    <ImageDrop>
      <Menu {...appProps} />
      {showHomeScreen.value && <DesktopHomeScreen />}
      <Container {...appProps} />
      {appProps.hideUI.value > 0 && <StatusBar {...appProps} />}
    </ImageDrop>
  )
}

/**
 * Save a file from the viewer (a scene document or a screenshot) through the
 * native save dialog, as a desktop app does, instead of a webview download.
 */
export async function saveWithNativeDialog(bytes: Uint8Array, filename: string): Promise<void> {
  try {
    await saveFileWithDialog(bytes, filename)
  } catch (error) {
    await message(String(error), { title: `Could not save ${filename}`, kind: 'error' })
  }
}

/**
 * Load a local file into NiiVue via the Tauri bridge.
 *
 * The caller is responsible for posting `initCanvas` to provision canvas
 * slots before invoking this for the first image of a batch. Decoupling the
 * canvas-count concern keeps batch loads (e.g. multi-select from the dialog)
 * correct without races between successive `addImage` posts.
 *
 * The path must already be authorised on the Rust side (registered via
 * `registerOpenedPath` after the dialog plugin returns it, or surfaced
 * through `listDirectory`).
 */
export async function loadFileFromPath(filePath: string, fileName: string): Promise<void> {
  const data = await readFileBytes(filePath)
  window.postMessage({
    type: 'addImage',
    body: {
      data: data.buffer,
      uri: fileName,
    },
  })
  // Persist for a future "recent files" UI. Fire and forget so the next
  // file in a batch starts loading before the JSON store flushes to disk.
  addRecentFile(filePath, fileName).catch(console.error)
}
