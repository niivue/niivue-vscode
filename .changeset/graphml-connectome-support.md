---
'@niivue/react': minor
'niivue': minor
'@niivue/pwa': patch
'@niivue/streamlit': patch
'@niivue/jupyter': patch
'@niivue/tauri': patch
---

Add support for the GraphML format.

GraphML files (e.g. vessel skeletons and brain networks exported by tools
such as SkelHub) now load as a NiiVue connectome: each `<node>` becomes a
sphere placed at its world-space `X`/`Y`/`Z` coordinates and each `<edge>`
becomes a cylinder joining the two nodes it references. This mirrors how the
source tools preview these graphs as points and lines.

- New `graphmlToConnectome()` helper exported from `@niivue/react` converts
  GraphML XML into NiiVue's connectome model (lowercase `x`/`y`/`z`
  coordinates are accepted as a fallback).
- `loadVolume` routes `*.graphml` payloads through the converter, whether the
  bytes arrive inlined (drag-and-drop) or have to be fetched from a URL
  (VS Code webview resource, `?images=` query parameter).
- The VS Code extension registers `*.graphml`, so a GraphML file opens
  directly in the NiiVue editor.
