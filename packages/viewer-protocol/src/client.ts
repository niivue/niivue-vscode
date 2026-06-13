import type { SceneDocument } from './document'

/**
 * An RFC-6902 JSON Patch operation. The scene document is the source of truth;
 * live commands are deltas applied to it (VHP plan sections 5-6). A niivue-vscode
 * `addImage` becomes `{ op: 'add', path: '/volumes/-', value }`.
 *
 * v1 is facade-first: the adapter ships a thin pass-through that maps only the
 * additions niivue-vscode already emits; the full patch engine lands with the
 * live transport (Phase 1b+).
 */
export interface JsonPatchOp {
  op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test'
  path: string
  value?: unknown
  from?: string
}

/** A cancellable subscription returned by `ViewerClient.on`. */
export interface Disposable {
  dispose(): void
}

/** Events a viewer emits toward the host, with their payload types. */
export interface ViewerEventMap {
  /** The viewer is initialized and ready to receive documents / patches. */
  ready: void
  /** Crosshair / cursor moved; payload is the host-facing location string. */
  locationChanged: string
  /** The scene document changed (after `applyDocument` / `applyPatch`). */
  documentChanged: void
  /** The viewer asks the host to pick files (host-services flow; reserved for Phase 1b). */
  requestFiles: { purpose?: string }
}

export type ViewerEvent = keyof ViewerEventMap

/**
 * What every compliant viewer UI implements (VHP plan section 5). One protocol,
 * many transports: a `ViewerClient` is the UI-side surface a host drives.
 *
 * - `applyDocument` - one-shot whole-scene load (import `.nvd`, deep-link, restore)
 * - `applyPatch`    - incremental edits to the live scene
 * - `getDocument`   - serialize the current scene for save / export
 * - `on`            - subscribe to host-facing events
 */
export interface ViewerClient {
  applyDocument(doc: SceneDocument): Promise<void>
  applyPatch(ops: JsonPatchOp[]): Promise<void>
  getDocument(): Promise<SceneDocument>
  on<E extends ViewerEvent>(event: E, cb: (payload: ViewerEventMap[E]) => void): Disposable
}
