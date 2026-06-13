import type { ExportDocumentData } from '@niivue/niivue'
import type {
  Disposable,
  JsonPatchOp,
  SceneDocument,
  ViewerClient,
  ViewerEvent,
  ViewerEventMap,
} from '@niivue/viewer-protocol'
import { effect } from '@preact/signals'
import type { AppProps } from './components/AppProps'
import { handleMessage } from './events'

/**
 * The niivue-react adapter's implementation of the Viewer-Host Protocol
 * `ViewerClient` (VHP plan section 5, 9). It is a thin facade over the existing
 * `{ type, body }` message bus (`handleMessage`) and the `AppProps` signal
 * state - the old protocol keeps working untouched; this is additive.
 *
 * v1 is facade-first: `applyDocument` / `getDocument` carry the `.nvd`
 * import/export feature; `applyPatch` is a minimal pass-through; the live
 * capability handshake and host-services RPC arrive with the second transport
 * (VS Code, Phase 1b).
 */
export function createViewerClient(appProps: AppProps): ViewerClient {
  const listeners: { [E in ViewerEvent]?: Set<(payload: unknown) => void> } = {}

  const emit = <E extends ViewerEvent>(event: E, payload: ViewerEventMap[E]) => {
    listeners[event]?.forEach((cb) => cb(payload as unknown))
  }

  // Bridge the app's location signal to the protocol `locationChanged` event.
  // The effect lives for the app-scoped lifetime of the client (not disposed).
  effect(() => {
    const loc = appProps.location.value
    if (loc) emit('locationChanged', loc)
  })

  // Pick the canvas to export: the first selected one, else the first canvas.
  // v1 scope is single-canvas import/export (VHP plan section 10).
  const getActiveNv = () => {
    const arr = appProps.nvArray.value
    if (arr.length === 0) return undefined
    const selection = appProps.selection.value
    const index = selection.length > 0 ? selection[0] : 0
    return arr[index] ?? arr[0]
  }

  return {
    async applyDocument(doc: SceneDocument): Promise<void> {
      // Route through the bus so the deferred canvas-load lifecycle (GL must be
      // attached before nv.loadDocument) is reused. Resolves once the load is
      // enqueued; completion is observable via the loadedCount hook / the
      // documentChanged event.
      await handleMessage(
        { type: 'loadDocument', body: { document: doc, name: doc.title } },
        appProps,
      )
      emit('documentChanged', undefined)
    },

    async applyPatch(ops: JsonPatchOp[]): Promise<void> {
      for (const op of ops) {
        // v1 facade-first maps only the addition niivue-vscode already emits
        // (VHP plan section 6). The full RFC-6902 engine lands with the live
        // transport (Phase 1b+).
        if (op.op === 'add' && op.path === '/volumes/-') {
          await handleMessage({ type: 'addImage', body: op.value }, appProps)
        } else {
          throw new Error(
            `applyPatch: operation "${op.op} ${op.path}" is not supported in v1 (facade-first)`,
          )
        }
      }
      if (ops.length > 0) emit('documentChanged', undefined)
    },

    async getDocument(): Promise<SceneDocument> {
      const nv = getActiveNv()
      if (!nv) throw new Error('getDocument: no canvas to export')
      // nv.json() syncs the live volumes/meshes into the document and embeds a
      // preview from the canvas. Cast at the niivue boundary: ExportDocumentData
      // is structurally the SceneDocument, modulo the export-only Map field.
      const exported: ExportDocumentData = nv.json()
      return exported as unknown as SceneDocument
    },

    on<E extends ViewerEvent>(event: E, cb: (payload: ViewerEventMap[E]) => void): Disposable {
      const set = (listeners[event] ??= new Set())
      set.add(cb as (payload: unknown) => void)
      if (event === 'ready') {
        // The client is only constructed once the app is mounted, so the
        // viewer is ready by definition - notify on the next microtask.
        queueMicrotask(() => cb(undefined as ViewerEventMap[E]))
      }
      return {
        dispose() {
          listeners[event]?.delete(cb as (payload: unknown) => void)
        },
      }
    },
  }
}
