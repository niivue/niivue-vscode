---
'@niivue/pwa': patch
'niivue': patch
'@niivue/jupyter': patch
---

Modernise app icons across the monorepo.

- **PWA**: switch to `@vite-pwa/assets-generator` (integrated `pwaAssets` mode) and refresh the master. Replaces the legacy 200×200 grayscale brain with the canonical 512×512 neon brand icon (downscaled from the 1024×1024 master at `niivue/niivue`). Generated icons (favicon.ico, pwa-64/192/512, maskable-512, apple-touch-180) ship in 256-color palette mode for ~5× smaller distribution size, and the manifest now uses correct per-purpose icons instead of the old `purpose: 'any maskable'` on an unpadded transparent PNG.
- **VS Code extension**: replace the 200×200 marketplace icon with a 128×128 `icon.png` (the VS Code spec) downsized from `apps/pwa/public/logo.png`, and the 200×200 language file-type icon with a 32×32 transparent `language-icon.png` downsized from the existing transparent-contrast PNG. Drop the now-unused `niivue/*.png` rules from `.vscodeignore`.
- **JupyterLab extension**: ship a 32×32 transparent `style/niivue-icon.png` directly under `style/`, decoupling `.jp-NiivueFileIcon` from the `build:assets` rsync chain. The CSS reference becomes `url('./niivue-icon.png')`.
- Drop the legacy 200×200 duplicates from `apps/vscode/`, `apps/jupyter/`, and the orphaned icons + favicon from `packages/niivue-react/public/`.
