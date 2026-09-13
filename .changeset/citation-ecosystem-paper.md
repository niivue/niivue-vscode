---
'@niivue/react': patch
'@niivue/pwa': patch
'@niivue/tauri': patch
'niivue': patch
'@niivue/jupyter': patch
'@niivue/streamlit': patch
---

Add citation information for the NiiVue wrapper ecosystem paper (Aperture Neuro, 2026, doi:10.52294/001c.167815).

- A `CITATION.cff` at the repository root enables GitHub's "Cite this repository" button.
- The root README gains a Citation section with the full reference and BibTeX; the VS Code Marketplace, JupyterLab and Streamlit READMEs (the extension and PyPI listings) link the paper.
- The About dialog asks users who publish with the viewer to cite the paper, with a DOI link.
- The brand menu now opens the About dialog in VS Code and JupyterLab too. It offers About only there; Reset Viewer stays on the standalone web and desktop apps.
