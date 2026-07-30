---
'@niivue/react': minor
'niivue': minor
'@niivue/pwa': patch
'@niivue/streamlit': patch
'@niivue/jupyter': patch
'@niivue/tauri': patch
---

Draw slices on the native voxel grid by default, with a **View > World Space** toggle (`W`) to switch back.

niivue 0.x had `opts.isSliceMM`, whose default (`false`) drew 2D slices on the voxel grid; `true` drew them in scanner/world mm space, which rotates and resamples an obliquely acquired volume. The v1 core dropped the option and always renders in world space, so an oblique acquisition came up rotated with no way to see the rectangular grid it was measured on (#266).

- Voxel space is restored through niivue's public affine API: the volume affine is replaced by its nearest axis-aligned equivalent, which makes the core derive an identity `obliqueRAS` and lay the slices back on the voxel grid. Each voxel axis keeps its direction, sign and length, so the voxel data is neither permuted nor mirrored, and the world origin stays on the same voxel so the crosshair does not jump. `resetVolumeAffine` restores world space exactly.
- The correction is derived from the background volume and applied to every volume of a canvas, so overlays stay registered to the background instead of each drifting onto its own grid. A volume that is already axis-aligned is left untouched, and an overlay loaded while voxel space is active is brought into line.
- New persisted `worldSpace` setting (default off), a `niivue.worldSpace` VS Code setting, and a `niivue.toggleWorldSpace` command bound to `W` so the shortcut is customizable in VS Code.
- Meshes are not moved onto the voxel grid with the volumes, and the mm readout becomes voxel-grid mm rather than scanner mm. Both limitations were also present in niivue 0.x's voxel-space mode.

The **Select** control moved out of its own slot at the far right of the top bar and is now a normal menu-bar item, trailing the others, so it reads as related to the menus it scopes. Like every other bar item it collapses into the overflow ("More") menu when the bar runs out of room.
