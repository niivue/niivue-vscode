# NiiVue Streamlit Component Frontend

Modern TypeScript/Preact frontend for the NiiVue Streamlit component, built with Vite.

## Features

- **Modern Tooling**: Vite for fast builds and HMR
- **TypeScript**: Full type safety
- **niivue-react**: Uses the shared niivue-react package components
- **Two Component Types**:
  - `StyledViewer`: Full-featured viewer with menu and controls
  - `UnstyledCanvas`: Minimal canvas-only viewer
- **Advanced Features**:
  - Overlay images support (multiple)
  - Multiple view modes (axial, coronal, sagittal, 3D, multiplanar)
  - Configurable display settings
  - Bidirectional communication with Python (click events)

## Development

```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Architecture

The component uses:

- **Preact**: Lightweight React alternative
- **@niivue/react**: Shared components from the monorepo
- **Streamlit Component Lib**: For Streamlit integration
- **Tailwind CSS**: For styling

## Build Output

The build creates optimized assets in `build/`:

- `index.html`: Entry point (not used directly by Streamlit)
- `assets/index.js`: Main JavaScript bundle
- `assets/index.css`: Styles
- `assets/*.wasm`: WebAssembly modules for DICOM support

## Integration with Streamlit

The Python component (`__init__.py`) reads the built JavaScript and CSS files
and injects them into an iframe for isolation.

## Monorepo Context

This package is part of a pnpm workspace and depends on:

- `@niivue/react`: Shared React components
- `@niivue/niivue`: Core NiiVue library
- `@niivue/dicom-loader`: DICOM file support

Due to pnpm workspace structure, the build scripts reference the root `node_modules/.bin`.
