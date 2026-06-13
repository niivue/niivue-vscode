---
'@niivue/react': minor
'niivue': minor
'@niivue/pwa': patch
'@niivue/streamlit': patch
'@niivue/jupyter': patch
'@niivue/tauri': patch
---

Detect extension-less DICOM files and open a whole series from one click.

DICOM exports often have no extension (IM_0001) or a bare UID as the file
name (1.2.840.113619...). These are now detected by content (the DICOM
Part 10 magic: a 128-byte preamble followed by "DICM") instead of relying
on the extension, and a single clicked DICOM file loads its entire series.

- New `isDicomData()` helper exported from `@niivue/react`.
- `loadVolume` content-sniffs payloads whose name matches no known format
  and routes matches through the DICOM loader. Multi-file input
  (`uri: string[]`) is now handled directly; previously an array URI threw
  before reaching the DICOM path, which also broke PWA folder drop.
- When dcm2niix returns more than one series (a folder with multiple
  acquisitions), each additional series opens on its own canvas.
- The VS Code extension expands a single opened DICOM file (by extension or
  by content, including extension-less files opened via "NiiVue: Open") to
  every DICOM file in its folder, so the full series loads together. The
  "Open DICOM Folder" path now sends a correct file array (it previously
  passed a single URI string alongside the data array).
