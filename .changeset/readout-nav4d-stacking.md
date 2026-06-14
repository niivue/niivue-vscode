---
'@niivue/react': patch
---

Stop the voxel location/value readout from overlapping the 4D navigator.

On a 4D volume the `POS … VAL …` readout and the 4D navigator bar both anchored
to the bottom-right corner of the pane, so they sat on top of each other.

When the 4D navigator is shown, the readout now lifts to `bottom: 48px` and
stacks directly above it. Stacking (rather than relocating the readout to
another corner) keeps both bars right-aligned and full-width safe on narrow
tiles, where neither would fit beside the other on a single edge. 3D panes are
unchanged.
