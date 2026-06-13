/**
 * What a host can do, negotiated once on connect (VHP plan section 5). The key
 * to "any UI x any host": the viewer adapts to the host rather than assuming a
 * fixed environment - e.g. fetch URLs itself vs. ask the host for bytes, show
 * its own file picker vs. delegate, download vs. host-side save.
 *
 * v1 is facade-first: this declares the shape. The live handshake lands with
 * the second transport (VS Code, Phase 1b). The same-window PWA host is
 * described by `defaultBrowserCapabilities`.
 */
export interface HostCapabilities {
  /** UI fetches URLs itself ('url'), host supplies bytes ('bytes'), or both. */
  resources: 'url' | 'bytes' | 'both'
  /** Host can show a native open dialog on the viewer's behalf. */
  filePicker: boolean
  /** Where "save" goes: nowhere, a browser download, or host-side storage. */
  persistence: 'none' | 'download' | 'host'
  /** Host streams incremental patches (true) or only one-shot documents. */
  live: boolean
  /** Named backend methods the host exposes via an RPC `invoke`, e.g. ['dcm2niix']. */
  compute?: string[]
}

/**
 * A browser / PWA host: fetches its own URLs, has the native `<input>` picker,
 * saves via download, and runs the viewer live in the same page.
 */
export const defaultBrowserCapabilities: HostCapabilities = {
  resources: 'both',
  filePicker: true,
  persistence: 'download',
  live: true,
}
