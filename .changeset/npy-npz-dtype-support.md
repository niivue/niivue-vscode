---
'@niivue/react': minor
'@niivue/pwa': patch
'niivue': patch
'@niivue/tauri': patch
'@niivue/streamlit': patch
'@niivue/jupyter': patch
---

Fix NumPy `.npy`/`.npz` loading (issue #90).

NiiVue's numpy reader only understands a fixed set of element types
(`b1, i1, u1, i2, u2, i4, u4, f4, f8`). NumPy's *default* integer dtype is int64
(`<i8`) - `np.save('x.npy', np.arange(...))`, label maps and masks all land here -
which the reader cannot handle, so those volumes came through corrupt/all-black
(silently mis-read on the old line) or simply failed to display.

`.npy`/`.npz` data is now converted (`packages/niivue-react/src/npy.ts`) before it is
handed to NiiVue; the result is still a `.npy` that NiiVue's own reader parses. Element
types the reader can't take are down-cast to ones it can:

- int64 -> int32 (or float64 if any value overflows the int32 range)
- uint64 -> uint32 (or float64 if any value overflows the uint32 range)

int32 is preferred over float64 so the data keeps integer semantics (label-map
auto-detection, integer colour scales). Types NiiVue already supports pass through
untouched, and genuinely undisplayable ones (complex, float16) now raise a clear,
actionable error instead of rendering black. `.npz` archives are unzipped directly
(both stored and deflate-compressed members) and their first array is converted.
