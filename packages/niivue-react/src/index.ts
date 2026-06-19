import './index.css'

export { AboutDialog } from './components/AboutDialog'
export { App } from './components/App'
export { useAppState } from './components/AppProps'
export type { AppInfo, AppProps, ScalingOpts, SelectionMode } from './components/AppProps'
export { Container } from './components/Container'
export { HeaderBox } from './components/HeaderBox'
export { ImageDrop } from './components/ImageDrop'
export { Menu } from './components/Menu'
export { NiiVueCanvas } from './components/NiiVueCanvas'
export { ScalingBox } from './components/ScalingBox'
export { Volume } from './components/Volume'
export { downloadNvd, isNvdFile, parseNvd, readNvdFile } from './document'
export * from './events'
export * from './hooks'
export * from './settings'
export * from './utility'
export { createViewerClient } from './viewer-client'
// Re-export the Viewer-Host Protocol contract so apps depend only on
// @niivue/react (the adapter), not on @niivue/viewer-protocol directly.
export type {
  Disposable,
  HostCapabilities,
  JsonPatchOp,
  SceneDocument,
  ViewerClient,
  ViewerEvent,
  ViewerEventMap,
} from '@niivue/viewer-protocol'
