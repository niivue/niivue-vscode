---
'@niivue/react': minor
'niivue': patch
'@niivue/pwa': patch
'@niivue/streamlit': patch
'@niivue/jupyter': patch
---

Add drag-and-drop reordering for loaded images.

- New `reorderImages<T>()` helper in `@niivue/react/utility` and a
  `reorder(fromIndex, toIndex)` callback wired through `Container` to each
  `Volume`.
- When the UI is fully visible (`hideUI > 2`), a thin grab strip appears at
  the top of each canvas; drag a volume onto another to insert it at the
  drop target's position.
- Drags use a custom MIME type (`application/x-niivue-reorder`) so the
  existing file-import drop path is unaffected.

Mouse-only for now; keyboard reorder is a follow-up.
