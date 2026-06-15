---
'@niivue/react': patch
---

Rework the per-pane 4D chrome so the readout, the 4D navigator and the
timeseries graph no longer overlap, and stabilise the voxel value width.

- The `POS … VAL …` readout now docks to the **bottom-left** of the pane, clear
  of both the 4D navigator and the timeseries graph NiiVue draws in the
  bottom-right quadrant.
- The 4D navigator stays in the bottom-right but is now a **thin vertical
  column** (`+ / frame / − / play / sync`), so it occupies very little
  horizontal space and leaves the bottom edge free for the readout even on
  narrow tiles.
- The voxel value is now fixed-width: integers print verbatim (e.g. `1044`),
  while floats show 5 significant figures without trimming trailing zeros, so
  the readout no longer jitters between e.g. `15.533` and `15.54` (it stays
  `15.540`) as the crosshair moves.
