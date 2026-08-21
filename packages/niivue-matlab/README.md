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

### Show a volume you computed in MATLAB

```matlab
Y = randn(64, 64, 40);
v = niivue.Viewer;
v.addVolume(Y, VoxelSize=[3 3 3]);
```

No file, no toolbox. Pass `Name="mymap.nii"` if you want it labelled.

### Compare images, the way Check Reg does

```matlab
niivue.checkreg(["mean.nii" "T1.nii" "atlas.nii"])
```

One crosshair, one world position, every image. There is no 24-image limit.

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
img = v.snapshot();        % uint8 H-by-W-by-3
imshow(img)

v.snapshot("figure1.png"); % straight to disk
```

Use this rather than `print` or `exportapp`. Those capture the viewer as a solid black rectangle,
because the GPU-composited surface is not in MATLAB's capture path. `snapshot` asks the viewer to
render its own bitmap and sends the pixels back, so the result behaves like any other image array.

## API

### `niivue.Viewer`

| Member | What it does |
|---|---|
| `Viewer(parent)` | Open a viewer, optionally inside an existing container |
| `addVolume(src, ...)` | Load a file path or a numeric array |
| `addMesh(src, ...)` | Load a surface |
| `setVolume(i, ...)` | Restyle a loaded volume |
| `removeVolume(i)` / `clear` | Remove one / all |
| `numVolumes` / `volumeInfo(i)` | How many, and what they are |
| `intensityAt(mm)` | Values of every layer at a world point |
| `setFrame(n, i)` | Choose the volume of a 4-D series |
| `set(...)` | Toggle colorbar, crosshair, radiological convention |
| `snapshot(file)` | Capture the render |
| `Crosshair` | Get/set cursor position, world mm |
| `Layout` | `"axial"`, `"coronal"`, `"sagittal"`, `"multiplanar"`, `"render"` |
| `CrosshairMoved`, `VolumeLoaded` | Events, for `addlistener` |

Name-value options on `addVolume`: `Colormap`, `Opacity`, `Threshold`, `Name`, `VoxelSize`.
`Threshold` is `[low high]` — values below `low` are transparent, which is what an overlay wants.

### Functions

| | |
|---|---|
| `niivue.show(files...)` | Open a viewer on one or more images |
| `niivue.checkreg(files)` | Linked comparison view |
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
runTests               % everything
runTests(Unit=true)    % data-path tests only, no display needed
```

Viewer tests open a real window and exercise the bridge in both directions. They are skipped rather
than failed on a session that cannot host one.

## License

BSD-2-Clause. NiiVue is developed at <https://github.com/niivue/niivue>.
