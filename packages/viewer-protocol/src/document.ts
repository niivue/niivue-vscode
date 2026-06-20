/**
 * The Viewer-Host Protocol scene document.
 *
 * VHP decision 3: adopt niivue's document serialization as-is. As of niivue
 * v1.0 that serialization is the CBOR `.nvd` byte payload produced by
 * `nv.serializeDocument(): Uint8Array` and consumed by
 * `nv.loadDocument(string | File)`. The document is therefore an opaque binary
 * blob, not a JSON object - hosts move the bytes around without inspecting them.
 *
 * This contract package stays decoupled from any specific niivue version by
 * typing the document as raw bytes. The niivue-react adapter is responsible for
 * wrapping/unwrapping these bytes against niivue's `serializeDocument()` /
 * `loadDocument()` at the boundary. Non-JS hosts (e.g. a Python `.nvd` author)
 * treat it as the on-disk `.nvd` file content, which these bytes are.
 */
export type SceneDocument = Uint8Array
