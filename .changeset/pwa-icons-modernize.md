---
'@niivue/pwa': patch
---

PWA icons: switch to `@vite-pwa/assets-generator` (integrated `pwaAssets` mode) and refresh the master. Replaces the legacy 200×200 grayscale brain with the canonical 512×512 neon brand icon (downscaled from the 1024×1024 master at `niivue/niivue`). Generated icons (favicon.ico, pwa-64/192/512, maskable-512, apple-touch-180) ship in 256-color palette mode for ~5× smaller distribution size, and the manifest now uses correct per-purpose icons instead of the old `purpose: 'any maskable'` on an unpadded transparent PNG.
