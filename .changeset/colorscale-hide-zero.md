---
'@niivue/react': minor
'niivue': patch
'@niivue/pwa': patch
'@niivue/streamlit': patch
'@niivue/jupyter': patch
'@niivue/tauri': patch
---

Add a "Hide 0" toggle to the ColorScale menu that renders zero/background voxels
as transparent (#237).

The overlay ColorScale popup gains a toggle next to **Invert** that flips the
layer's Niivue `colormapType` between `MIN_TO_MAX` (the default opaque mapping)
and `ZERO_TO_MAX_TRANSPARENT_BELOW_MIN`. When enabled, voxels valued at zero
become transparent regardless of the selected colormap, the cal_min/cal_max
range, or whether the data is integer or float. It works for both volume layers
and mesh layers, mirroring the existing per-overlay Invert control.

Because `ZERO_TO_MAX_TRANSPARENT_BELOW_MIN` re-anchors the colormap at zero, a
signed overlay (cal_min &lt; 0) would otherwise lose its entire negative half.
To prevent that, enabling **Hide 0** on signed data that has no negative colormap
automatically adds one (`winter`) so the negative values stay visible; the
addition is removed again when the toggle is switched off, and a user-chosen
negative/symmetric colormap is never overwritten.
