---
'@niivue/react': patch
'niivue': patch
'@niivue/jupyter': patch
'@niivue/pwa': patch
'@niivue/streamlit': patch
---

shift+drop adds files as overlays to the last canvas instead of creating new ones
overlay handler resolves index -1 to last canvas with bounds check
HeaderBox now uses signal effect instead of stale useEffect dependency
added onVolumeUpdated callback to ExtendedNiivue, called after load
