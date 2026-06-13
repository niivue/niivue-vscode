---
'@niivue/react': minor
'niivue': patch
'@niivue/pwa': patch
'@niivue/streamlit': patch
'@niivue/jupyter': patch
'@niivue/tauri': patch
---

Fix canvas tile layout overflow and add an adjustable tile spacing control.

The grid that arranges the viewer canvases sized each tile too generously: it
subtracted only a single gap per axis and ignored both the 1px tile border and
the wrapper margin. With several images open the last tile no longer fit on the
row, so it either spilled past the right edge or wrapped into a second row that
was cut off at the bottom.

- `getCanvasSize` now budgets every consumer of space explicitly (the wrapper
  margin, the per-tile border, and the correct `(n-1)` inter-tile gaps), so the
  computed tiles always fit the viewport. The packing math moved to a dedicated,
  unit-tested `layout.ts`.
- New **View > Tile Spacing** control adjusts the gap between canvases, backed by
  a persisted `tileSpacing` setting (default 4px).
- PWA: normalize the Windows backslash path in the Tailwind `content` glob so the
  `@niivue/react` source is scanned on Windows too (its utility classes were
  silently dropped from local Windows builds).
