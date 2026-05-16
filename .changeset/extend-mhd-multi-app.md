---
"niivue": patch
"@niivue/react": patch
"@niivue/jupyter": patch
"@niivue/streamlit": patch
"@niivue/pwa": patch
---

Extend MHD detached-header support beyond the VS Code extension. The PWA, Jupyter and Streamlit apps now resolve a `.mhd` header's `ElementDataFile` reference and fetch (or forward) the paired `.raw` voxel data: PWA via drag/drop and `?images=` URL auto-fetch, Jupyter via the Contents API in the iframe, Streamlit via a new `paired_data` Python argument. When the paired raw file is missing or the reference is unsafe (path traversal, nested dirs), a clear "Missing paired data file…" warning is surfaced in the existing on-canvas error overlay instead of a silent black render. The VS Code path also rejects non-sibling references for consistency.
