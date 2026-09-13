---
'@niivue/pwa': patch
'niivue': patch
'@niivue/jupyter': patch
'@niivue/react': patch
---

Modernise app icons across the monorepo.

- **PWA**: icons come from `@vite-pwa/assets-generator` (integrated `pwaAssets` mode) and show the canonical neon brand icon instead of the legacy grayscale brain. The manifest now uses correct per-purpose icons instead of the old `purpose: 'any maskable'` on an unpadded transparent PNG, and the icons ship palette-quantized for a smaller download.
- **VS Code extension and JupyterLab extension**: the Marketplace, file-type and Jupyter icons show the same neon brand mark.
- **Top bar (`@niivue/react`)**: the menu-bar brand mark shows the neon brain logo in place of the placeholder "N".
