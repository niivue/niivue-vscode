# NiiVue for MATLAB

A fast, GPU-accelerated viewer for NIfTI, DICOM, meshes and tractography — inside a MATLAB figure.

```matlab
niivue.show("T1.nii")
```

That is the whole quick start. The window that opens is a real MATLAB figure you can dock, position
and put in an App Designer app, and everything in it is scriptable from the command line.

---

## Why you might want it

- **It is fast.** Rendering runs on the GPU, so panning, zooming and scrolling through a large
  volume stay smooth where a `slice`-and-`imagesc` approach does not.
- **It reads what you already have.** NIfTI (`.nii`, `.nii.gz`), MGH/MGZ, NRRD, MHD, DICOM,
  GIfTI and FreeSurfer surfaces, TCK/TRK/TRX tracts. No conversion step.
- **It talks back.** Click a voxel and MATLAB hears about it, in world millimetres, with the
  intensity of every loaded layer. That makes it usable as the front end of an analysis, not just a
  picture.
- **No toolboxes required.** Base MATLAB is enough — including for loading plain workspace arrays,
  which are written out through a built-in NIfTI writer rather than `niftiwrite`.

## Requirements

| | |
|---|---|
| MATLAB | **R2023a or newer** |
| Platform | Windows, macOS or Linux, with a graphical session |
| Toolboxes | none |

R2023a is the floor because the viewer talks to MATLAB over `sendEventToHTMLSource`. Earlier
releases offer only a single shared property, which silently drops commands sent back to back —
not a foundation worth building on. Tested on R2024b and R2026a.

Not sure whether your session can run it? Ask:

```matlab
niivue.diagnose
```

## Install

Add the `matlab` folder to your path:

```matlab
addpath("path/to/niivue-matlab/matlab")
savepath   % optional, to persist it
```

Working from a source checkout? Build the viewer bundle once first:

```bash
pnpm install
pnpm --filter @niivue/matlab build
```

## Quick start

```matlab
% One image
niivue.show("T1.nii")

% A statistical map over an anatomical
v = niivue.Viewer;
v.addVolume("T1.nii");
v.addVolume("spmT_0001.nii", Colormap="hot", Threshold=[3.1 8]);

% Jump to a coordinate, in world millimetres
v.Crosshair = [40 -22 52];

% Read back what is under the cursor
disp(v.Crosshair)
disp(v.intensityAt([40 -22 52]))
```

Everything is in **world millimetres** and volume indices are **1-based**, so coordinates match your
image header and indices match MATLAB.

## Recipes

### React to the user clicking a voxel

```matlab
v = niivue.Viewer;
v.addVolume("T1.nii");

addlistener(v, "CrosshairMoved", @(~, e) fprintf( ...
    "%.1f %.1f %.1f mm\n", e.Millimetres));
```

The event carries `Millimetres`, `Voxel` and `Values` (one entry per loaded layer), which is enough
to drive a plot, extract a time course, or look a label up in an atlas.

### Show an array straight from the workspace

```matlab
Y = randn(64, 64, 40);
v = niivue.Viewer;
v.addVolume(Y, VoxelSize=[3 3 3]);
```

No file, no toolbox, no conversion step. The array is written out through a built-in NIfTI writer,
so this works in base MATLAB.

- **Types**: `logical`, `uint8`, `int16`, `uint16`, `int32`, `single`, `double`. Anything else is
  promoted to `single` rather than refused.
- **4-D** arrays become a series: `v.addVolume(T)` then `v.setFrame(3)` to scrub.
- **Voxel size** defaults to `[1 1 1]`; pass `VoxelSize` in millimetres to get the geometry right.
- **Name** it with `Name="mymap.nii"` so it is labelled in the layer list.

Array element `Y(i,j,k)` becomes voxel `(i-1, j-1, k-1)`, and the world origin is placed at the
centre of the volume, so the crosshair opens somewhere sensible rather than at a corner. Concretely,
`Y(i,j,k)` sits at

```matlab
mm = VoxelSize .* ([i j k] - 1) - VoxelSize .* (size(Y) - 1) / 2;
```

which means `v.intensityAt(mm)` returns exactly that element. The test suite asserts this with a
single-voxel spike, so an axis permutation or an origin slip cannot pass unnoticed.

An array carries no header, so this is a plain scaled identity — no obliquity and no scanner
coordinates. When you have a real header, load the **file**: the geometry then comes from the image
rather than from an assumption.

### Open several images at once

Two different things you might mean, and each has its own call.

**Side by side**, one panel per image, one crosshair driving all of them:

```matlab
niivue.compare(["mean.nii" "T1.nii" "atlas.nii"])
```

**Stacked**, as overlays in a single panel:

```matlab
niivue.show("T1.nii", "spmT_0001.nii")
```

Both take whatever shape your script already has — no need to build a list by hand:

```matlab
niivue.compare("derivatives/*_T1w.nii.gz")   % wildcard, expanded and sorted
niivue.compare("sub-01/anat")                % a folder: every image in it
niivue.compare(dir("**/*_bold.nii.gz"))      % dir() output, straight in
niivue.compare({'a.nii', 'b.nii'})           % cellstr
niivue.compare(subjects + "/T1.nii")         % string array from a loop
```

So a whole cohort is one line:

```matlab
subjects = "sub-" + string(1:12, "%02d");
niivue.compare(subjects + "/anat/T1w.nii.gz")
```

`niivue.checkreg` is the same as `compare`, under the name SPM users reach for. Unlike
`spm_check_registration` there is no 24-image limit.

Panels are linked by world position, so the crosshair lands on the same anatomy in every image
regardless of their voxel grids — which is the point of looking at them together.

### Put it in an App Designer app

```matlab
app.Nv = niivue.Component(app.UIFigure);
app.Nv.Position = [10 10 600 400];
app.Nv.Viewer.addVolume("T1.nii");

addlistener(app.Nv.Viewer, "CrosshairMoved", @(~, e) ...
    set(app.CoordLabel, "Text", sprintf("%.1f %.1f %.1f mm", e.Millimetres)));
```

### Get the rendering into a figure or a file

```matlab
img = v.snapshot();          % uint8 H-by-W-by-3
imshow(img)

v.snapshot("figure1.png");   % straight to disk

[img, info] = v.snapshot();  % info.panels, info.width, info.height
```

A tiled comparison captures as the whole grid, not just the first panel;
`info.panels` tells you how many went in.

Use this rather than `print` or `exportapp`. Those capture the viewer as a solid black rectangle,
because the GPU-composited surface is not in MATLAB's capture path. `snapshot` asks the viewer to
render its own bitmap and sends the pixels back, so the result behaves like any other image array.

## API

### `niivue.Viewer`

| Member | What it does |
|---|---|
| `Viewer(parent)` | Open a viewer, optionally inside an existing container |
| `addVolume(src, ...)` | Load a file path or a numeric array, stacked as a layer |
| `openTiles(files)` | Open each image in its own linked panel |
| `addMesh(src, ...)` | Load a surface |
| `setVolume(i, ...)` | Restyle a loaded volume |
| `removeVolume(i)` / `clear` | Remove one / all |
| `numVolumes` / `volumeInfo(i)` | How many, and what they are |
| `intensityAt(mm)` | Values of every layer at a world point |
| `setFrame(n, i)` | Choose the volume of a 4-D series |
| `set(...)` | Toggle colorbar, crosshair, radiological convention |
| `snapshot(file)` | Capture the render, every panel included |
| `Crosshair` | Get/set cursor position, world mm |
| `Layout` | `"axial"`, `"coronal"`, `"sagittal"`, `"multiplanar"`, `"render"` |
| `CrosshairMoved`, `VolumeLoaded` | Events, for `addlistener` |

Name-value options on `addVolume`: `Colormap`, `Opacity`, `Threshold`, `Name`, `VoxelSize`.
`Threshold` is `[low high]` — values below `low` are transparent, which is what an overlay wants.

### Functions

| | |
|---|---|
| `niivue.show(files...)` | Open images stacked as overlays |
| `niivue.compare(files)` | Open images side by side, crosshair linked |
| `niivue.checkreg(files)` | `compare`, under the SPM name |
| `niivue.diagnose` | Check this session and report what is missing |

## How it works

The viewer is a self-contained web page rendered by `uihtml` inside your figure. Two channels
connect it to MATLAB, and they are deliberately different:

- **Commands and results** travel over the `uihtml` event channel. Each message is queued
  individually and carries a correlation id, which is what makes `v.Crosshair` a getter and not
  just a setter. Measured round trip: about 13 ms.
- **Image data** never goes over that channel. MATLAB writes the file next to the page and the
  viewer fetches it from MATLAB's own local server at roughly 70 MB/s. Encoding a volume as base64
  and pushing it through a property — the obvious alternative — runs at about 1 MB/s, which is
  minutes for a single fMRI run.

Files are staged with a `.bin` extension because MATLAB's static route serves only an allowlist;
`.nii` and `.nii.gz` return 404. The real filename travels alongside, so the viewer still picks the
right reader.

### First open is slow

Opening the first viewer in a MATLAB session takes roughly ten seconds: a ~2 MB bundle has to load,
a browser process start and a GPU device come up. Later viewers in the same session are quicker.
Keep a viewer and reuse it — `clear` then `addVolume` is close to instant — rather than opening a
new one per image.

## Troubleshooting

**`niivue.diagnose` says the bundle is missing.** Build it: `pnpm --filter @niivue/matlab build`.

**The window opens but stays blank.** The embedded browser could not get a WebGL context. This is
most likely over remote desktop, in a VM, or on a headless server with no GPU.

**"This viewer has been closed."** The figure was closed; make a new `niivue.Viewer`.

**Commands seem to do nothing on an old MATLAB.** Releases before R2023a are not supported, and the
package refuses to start on them rather than failing quietly. Check with `niivue.diagnose`.

## Tests

```matlab
cd matlab/tests
runTests                     % everything this session can run
runTests(Unit=true)          % data-path tests only, no display needed
runTests(RequireViewer=true) % fail if the viewer tests could not run
```

Viewer tests open a real window and exercise the bridge in both directions. They are skipped rather
than failed on a session that cannot host one.

## License

BSD-2-Clause. NiiVue is developed at <https://github.com/niivue/niivue>.
