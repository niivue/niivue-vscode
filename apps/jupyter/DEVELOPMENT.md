# JupyterLab Extension Development

This guide covers development setup specific to the JupyterLab extension. For general monorepo setup, see the [root DEVELOPMENT.md](../../DEVELOPMENT.md).

## Prerequisites

See root DEVELOPMENT.md for:

- Node.js and pnpm requirements
- Dev container setup (recommended)
- Monorepo tools (Turborepo, pnpm workspaces)

Additional requirements for JupyterLab:

- Python ≥3.8 (from pyproject.toml)
- JupyterLab ≥4.0.0 (from pyproject.toml)

## Quick Start

### Using Dev Container (Recommended)

1. Open repository in VS Code
2. Reopen in container when prompted
3. Container automatically sets up JupyterLab

### Manual Setup

```bash
# From repository root
pnpm install
pnpm build

# Install extension in development mode
cd apps/jupyter
jupyter labextension develop . --overwrite

# Start JupyterLab
jupyter lab
```

## Development Workflow

### Making Changes to Extension Code

1. Edit TypeScript files in `apps/jupyter/src/`
2. Rebuild the extension:
   ```bash
   cd apps/jupyter
   pnpm build
   ```
3. Refresh JupyterLab in your browser

### Making Changes to React Components

Since this extension uses `@niivue/react`:

1. Edit files in `packages/niivue-react/src/`
2. Rebuild from repository root:
   ```bash
   pnpm build
   ```
3. Rebuild JupyterLab extension:
   ```bash
   cd apps/jupyter
   pnpm build
   ```
4. Refresh JupyterLab

### Watch Mode (still buggy)

For continuous development:

```bash
# Terminal 1: Watch TypeScript compilation
cd apps/jupyter
pnpm watch:lib

# Terminal 2: Watch JupyterLab extension
pnpm watch:labextension
```

## Publishing to PyPI

It is recommended to release to TestPyPI first and test the installation and usage of the extension in a separate devcontainer before release to PyPI.

### Test Release (TestPyPI)

```bash
cd apps/jupyter
pnpm release:test
```

### Production Release

```bash
cd apps/jupyter
pnpm release:prod
```

### Manual Build and Release

```bash
# Clean and build
pnpm clean:all
pnpm build:prod

# Build Python wheel
python -m build --wheel

# Check distribution
python -m twine check dist/*

# Upload to PyPI
python -m twine upload dist/*
```

## Project Structure

```
apps/jupyter/
├── src/                    # TypeScript source files
│   ├── index.ts           # Extension entry point
│   ├── viewer.ts          # Main viewer widget
│   └── commands.ts        # JupyterLab commands
├── lib/                   # Compiled JavaScript output
├── static/                # Static assets (built from @niivue/react)
├── jupyterlab_niivue/     # Python package
│   ├── __init__.py
│   └── labextension/      # Built extension assets
├── style/                 # CSS styles
├── package.json           # Node.js dependencies and scripts
├── pyproject.toml         # Python package configuration
└── webpack.config.js      # Webpack configuration
```

## Debugging

### Browser DevTools

1. Open JupyterLab in browser
2. Open DevTools (F12)
3. Check Console for extension logs
4. Use `console.log()` in TypeScript code

## Dependencies

### Runtime Dependencies

From `package.json`:

- `@jupyterlab/application` ^4.4.5
- `@jupyterlab/docregistry` ^4.4.5
- `@jupyterlab/filebrowser` ^4.4.9
- `@niivue/niivue` ^0.67.0

### Development Dependencies

- `@niivue/react` (workspace dependency)
- TypeScript compilation tools
- Webpack and loaders
- ESLint and Prettier for code quality

## Configuration Files

- `package.json`: Node.js dependencies and build scripts
- `pyproject.toml`: Python package metadata and build configuration
- `webpack.config.js`: Webpack bundling configuration
- `tsconfig.json`: TypeScript compiler options
- `hatch_build.py`: Custom Python build hooks

## Resources

- [JupyterLab Extension Guide](https://jupyterlab.readthedocs.io/en/stable/extension/extension_dev.html)
- [Hatch Build System](https://hatch.pypa.io/)
- [PyPI Publishing](https://packaging.python.org/tutorials/packaging-projects/)
- [Root Development Guide](../../DEVELOPMENT.md)
