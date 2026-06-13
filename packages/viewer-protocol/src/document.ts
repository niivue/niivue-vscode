/**
 * The Viewer-Host Protocol scene document.
 *
 * VHP decision 3: adopt niivue's `NVDocument` serialization as-is - exactly
 * what `nv.json()` produces and `NVDocument.loadFromJSON()` consumes (the
 * `.nvd` format). No schema layer or version tag in v1.
 *
 * This contract package stays decoupled from any specific niivue version by
 * typing the document structurally, as plain JSON. The niivue-react adapter
 * bridges to niivue's precise `ExportDocumentData` / `DocumentData` types at
 * the boundary. Non-JS hosts (e.g. FreeBrowse's Python `.nvd` authoring) treat
 * it as plain JSON, which this open type permits.
 */
export interface SceneDocument {
  title?: string
  /** base64-encoded image volumes, for a self-contained (embedded) `.nvd`. */
  encodedImageBlobs?: string[]
  /** base64-encoded drawing/segmentation bitmap, when present. */
  encodedDrawingBlob?: string
  /** Data-URL thumbnail of the scene. */
  previewImageDataURL?: string
  /** Per-image load options; carries linked-data URLs for a non-embedded `.nvd`. */
  imageOptionsArray?: unknown[]
  meshOptionsArray?: unknown[]
  meshesString?: string
  /** Serialized `NVConfigOptions` (view options). */
  opts?: Record<string, unknown>
  /** Camera / crosshair / clip-plane scene state. */
  sceneData?: Record<string, unknown>
  labels?: unknown[]
  connectomes?: string[]
  customData?: string
  /**
   * Forward-compatible: tolerate niivue adding document fields without a
   * schema bump (decision 3, adopt-as-is, no version contract).
   */
  [key: string]: unknown
}
