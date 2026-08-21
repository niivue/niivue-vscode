---
'@niivue/matlab': minor
---

Rebuild the MATLAB package around the uihtml event channel and a file handoff.

Control messages now use sendEventToHTMLSource, which queues each message and
carries a correlation id, so commands issued back to back all arrive and the
MATLAB API can expose real getters. Volume bytes move through MATLAB's static
route at ~70 MB/s instead of base64 through a property at ~1 MB/s.

The user-facing API is new: niivue.show for one-liners, niivue.Viewer with
properties and events, niivue.checkreg, niivue.diagnose, and snapshot() to get
the render back as an image array. Volumes can be loaded from workspace arrays
with no toolbox dependency. Minimum release is R2023a.
