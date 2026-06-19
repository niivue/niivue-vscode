---
'@niivue/react': minor
'@niivue/pwa': minor
'@niivue/tauri': patch
'niivue': patch
'@niivue/streamlit': patch
'@niivue/jupyter': patch
---

Compact the viewer top bar, unify the status readout, and drive every app icon from a single committed master.

- **Top bar (VS Code).** Wire the previously-unused `.nv-form-vscode` density tokens onto the webview so the bar drops from 48px to 36px. The brand mark keeps its size; only the empty space above and below it shrinks.
- **One status strip.** A new shared `StatusBar` merges the image-metadata line (formerly under the top bar) and the crosshair `mm` readout (formerly a separate footer) into one slim bottom strip, used across the VS Code, PWA, desktop, and Streamlit hosts. The global mm readout now populates on load even if NiiVue's initial location event fires before the canvas selection is initialized (previously it could stay blank until the first crosshair move).
- **Scrollbar fix.** The canvas now sizes off a `ResizeObserver` on its container instead of only `window.onresize`, so a menu-bar reflow (overflow into "More", the status strip toggling) no longer leaves a stale, oversized canvas with scrollbars on both axes.
- **Icons.** Every app icon (VS Code file-type + marketplace, Jupyter, Tauri, PWA, and the in-app viewer logo) is now generated from one committed master, `branding/niivue-icon.png`, via `pnpm generate:icons`. The file-type and viewer icons become a transparent neon mark (no more dark tile); generated outputs are gitignored and rebuilt by each app's build. The one committed generated file, `niivue-logo.ts`, stamps the master's hash so CI catches drift.
