---
'@niivue/streamlit': minor
---

Add `load_events=True`, which tells Python when the image is shown (`base_loaded`), when its overlays and meshes have loaded too (`fully_loaded`), or that it failed to load (`load_error`), for example to start a timer only once the image is visible.
