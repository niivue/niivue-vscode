---
'@niivue/react': patch
---

Open NiiVue documents (`.nvd`) more safely: a damaged or oversized document is refused instead of using up the memory. Documents are saved in the current format (version 11), which earlier beta builds cannot open; documents from earlier builds still open. Translucent overlays in the 3D render follow the opacity setting more evenly and look lighter than before.
