# NiiVue MATLAB Integration

High-performance neuroimaging visualization for MATLAB using NiiVue's WebGL capabilities.

## Installation

1. Build the package:

   ```bash
   cd packages/niivue-matlab
   pnpm install
   pnpm build
   ```

2. Add the MATLAB directory to your MATLAB path:
   ```matlab
   addpath('/path/to/packages/niivue-matlab/matlab')
   ```

## Usage

### Quick Start - Standalone Viewer

Launch a standalone viewer with one or more NIfTI files:

```matlab
% Open empty viewer
niivue.Viewer()

% Open with a single volume
niivue.Viewer('T1.nii')

% Open with multiple volumes
niivue.Viewer('T1.nii', 'fMRI.nii')

% Get controller for further manipulation
nv = niivue.Viewer('T1.nii');
nv.setColormap('hot');
```

### Scripting with Controller

For programmatic control, use the `Controller` class:

```matlab
% Create controller
nv = niivue.Controller();

% Add volumes with method chaining
nv.addVolume('T1.nii');
nv.setColormap('gray');
nv.setOpacity(0.8);

% Add overlay with custom colormap
nv.addVolume('activation.nii', 'colormap', 'hot', 'opacity', 0.5);

% Add mesh
nv.addMesh('brain.obj');

% Set crosshair position
nv.setCrosshair(64, 64, 32);

% Change slice view
nv.setSliceType(4); % Multiplanar view

% Clear all volumes
nv.clear();
```

### App Designer Integration

The `Component` class can be embedded in App Designer applications:

```matlab
classdef MyNeuroviewer < matlab.apps.AppBase
    properties (Access = public)
        UIFigure  matlab.ui.Figure
        NiiVueViewer  niivue.Component
    end

    methods (Access = private)
        function startupFcn(app)
            % Create NiiVue component
            app.NiiVueViewer = niivue.Component(app.UIFigure);
            app.NiiVueViewer.Position = [10, 10, 600, 400];

            % Load a volume
            app.NiiVueViewer.addVolume('T1.nii');

            % Listen for crosshair changes
            addlistener(app.NiiVueViewer, 'CrosshairChanged', ...
                @(src, evt) disp(src.CrosshairPos));
        end
    end
end
```

## API Reference

### niivue.Controller

**Constructor:**

- `Controller()` - Create viewer in new figure
- `Controller(fig)` - Create viewer in existing figure

**Methods:**

- `addVolume(filepath)` - Load NIfTI volume
- `addVolume(filepath, 'colormap', name, 'opacity', value)` - Load with options
- `setColormap(name, index)` - Set colormap for volume
- `setOpacity(value, index)` - Set opacity for volume (0-1)
- `addMesh(filepath)` - Load mesh file (.obj, .gii, etc.)
- `setCrosshair(x, y, z)` - Set crosshair position
- `setSliceType(type)` - Set view type (0-4)
- `clear()` - Remove all volumes

**Properties:**

- `Figure` - Handle to uifigure
- `CrosshairPos` - Current crosshair position [x, y, z]

### niivue.Viewer

**Function:**

- `Viewer()` - Launch empty viewer
- `Viewer(file1, file2, ...)` - Launch with files
- `nv = Viewer(...)` - Return Controller for further control

### niivue.Component

**Constructor:**

- `Component(parent)` - Create component in parent container

**Properties:**

- `FilePath` - Path to current NIfTI file
- `Colormap` - Current colormap name
- `Opacity` - Current opacity (0-1)
- `CrosshairPos` - Current crosshair position [x, y, z]

**Events:**

- `CrosshairChanged` - Fired when crosshair moves

**Methods:**

- `addVolume(filepath, ...)` - Load volume with options
- `setColormap(name, index)` - Set colormap
- `setCrosshair(x, y, z)` - Set crosshair position

## Supported File Formats

- **Volumes:** NIfTI (.nii, .nii.gz), NRRD, MGH/MGZ
- **Meshes:** OBJ, GIfTI (.gii), FreeSurfer, PLY, STL, VTK

## Technical Details

### Communication Protocol

The MATLAB wrapper communicates with the JavaScript viewer using MATLAB's `uihtml` component:

1. **MATLAB → JavaScript:** Binary data (NIfTI files) are read as `uint8`, encoded to Base64, and sent via the `Data` property.

2. **JavaScript → MATLAB:** The viewer sends updates (e.g., crosshair position) back through the `DataChanged` event.

### Message Types

**From MATLAB to Viewer:**

- `loadVolume` - Load a volume from Base64 data
- `setColormap` - Change volume colormap
- `setOpacity` - Change volume opacity
- `updateCrosshairs` - Update crosshair position
- `addMesh` - Load a mesh from Base64 data
- `setSliceType` - Change slice view type
- `clearVolumes` - Remove all volumes

**From Viewer to MATLAB:**

- `viewerReady` - Viewer initialized and ready
- `crosshairUpdate` - Crosshair position changed
- `error` - Error occurred in viewer

## Performance Notes

- The single-file HTML build includes all JavaScript and CSS inline for easy deployment
- Base64 encoding adds ~33% overhead to file size, but simplifies data transfer
- Crosshair updates are throttled to 100ms intervals to avoid excessive communication

## Building from Source

```bash
# Install dependencies
pnpm install

# Development build (watch mode)
pnpm dev

# Production build
pnpm build
```

The build process creates a single HTML file (`dist/index.html`) with all assets inlined.

## License

BSD-2-Clause
