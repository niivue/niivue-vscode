# Installation Guide

## Method 1: Direct Installation (Recommended for Development)

1. **Build the package:**

   ```bash
   cd packages/niivue-matlab
   pnpm install
   pnpm build
   ```

2. **Add to MATLAB path:**

   ```matlab
   addpath('/path/to/niivue-vscode/packages/niivue-matlab/matlab')
   savepath
   ```

3. **Test the installation:**
   ```matlab
   niivue.Viewer()
   ```

## Method 2: MATLAB Toolbox Package (.mltbx)

### Creating the Toolbox

1. **Build the package first:**

   ```bash
   cd packages/niivue-matlab
   pnpm build
   ```

2. **Create the toolbox in MATLAB:**
   - Open MATLAB
   - Run: `cd packaging` (from the niivue-matlab directory)
   - Run: `build_toolbox`
   - Follow the instructions to use MATLAB's Toolbox Packager

### Installing the Toolbox

1. Double-click the `.mltbx` file, or
2. In MATLAB, run: `matlab.addons.install('niivue_matlab.mltbx')`

## Verifying Installation

```matlab
% Should show the niivue package
which niivue.Viewer

% Launch a test viewer
niivue.Viewer()
```

## Requirements

- **MATLAB R2020b or later** (requires uihtml support)
- **MATLAB R2022b or later recommended** (for best uihtml performance)
- No additional MATLAB toolboxes required

## Troubleshooting

### "HTML file not found" Error

Make sure you've built the package:

```bash
cd packages/niivue-matlab
pnpm build
```

The build should create `dist/index.html` (approximately 3.2 MB).

### "uihtml not found" Error

Your MATLAB version is too old. The `uihtml` component was introduced in R2020b.

### Viewer appears blank

Check the MATLAB console for JavaScript errors. Make sure:

1. The HTML file exists at `packages/niivue-matlab/dist/index.html`
2. Your MATLAB version supports modern JavaScript (R2022b+ recommended)

### Cannot load NIfTI files

Ensure:

1. File path is correct and accessible
2. File is a valid NIfTI format (.nii or .nii.gz)
3. File permissions allow reading

## Uninstallation

### If installed via addpath:

```matlab
rmpath('/path/to/niivue-vscode/packages/niivue-matlab/matlab')
savepath
```

### If installed as toolbox:

```matlab
matlab.addons.uninstall('NiiVue for MATLAB')
```

## Next Steps

- See [README.md](../README.md) for usage examples
- Check [examples/basic_usage.m](../matlab/examples/basic_usage.m) for sample code
- Visit the [NiiVue website](https://niivue.github.io/niivue/) for more information
