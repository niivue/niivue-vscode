---
'@niivue/react': minor
'@niivue/pwa': minor
'@niivue/tauri': patch
'niivue': patch
'@niivue/streamlit': patch
'@niivue/jupyter': patch
---

Fold the Home button into the brand, and turn "Save Scene" into an NVDocument Save/Load split button.

- The standalone "Home" menu-bar button is gone. On standalone hosts (web, desktop)
  the niivue logo + wordmark is now a dropdown: **Reset Viewer** (the old Home
  action) and **About** (a dialog with the app's purpose, NiiVue + NeuroDesk
  credits, the data-privacy note, and the build version linking to its commit).
  The brand stays static on embedded hosts (VS Code; Streamlit, which sets
  `menuItems.home: false`), so their behavior is unchanged.
- "Save Scene" is renamed **NVDocument** and gains a chevron: clicking the label
  still saves the active scene as a `.nvd` by default, while the dropdown offers
  **Save** and a new **Load** (a `.nvd` file picker, complementing drag-and-drop).
- Hosts can pass an optional `appInfo` ({ version, buildDate, repoUrl }) to
  `Menu`; the PWA wires in its build-time git metadata. The About dialog degrades
  gracefully (omits the version line) when a host supplies none.
