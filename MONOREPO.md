# NiiVue Monorepo

A modern monorepo containing multiple NiiVue applications and packages for neuroimaging visualization.

## Structure

### Applications (`apps/`)

- **`vscode/`** - VS Code extension for viewing NIfTI files
- **`pwa/`** - Progressive Web App (slim wrapper around niivue-react)
- **`jupyter/`** - JupyterLab extension
- **`streamlit/`** - Streamlit component
- **`desktop-tauri/`** - Standalone desktop app built with Tauri (native file I/O, cross-platform)

### Packages (`packages/`)

- **`niivue-react/`** - Core React components and utilities for NiiVue
- **`viewer-protocol/`** - Viewer-Host Protocol contract (types and constants only) for niivue-based viewers

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
# Install dependencies for all packages
pnpm install

# Build all packages
pnpm build

# Start development mode for all apps
pnpm dev
```

### Development

```bash
# Run specific app
pnpm --filter @niivue/pwa dev
pnpm --filter niivue watch

# Build specific package
pnpm --filter @niivue/react build

# Run tests
pnpm test

# Lint code
pnpm lint
```

## Architecture

The monorepo uses:

- **pnpm workspaces** for dependency management
- **Turborepo** for build orchestration and caching
- **TypeScript project references** for type checking
- **Shared ESLint/Prettier configs** for consistent code style

## Deployment & Releases

Each app has its own version, managed with **Changesets**. Read the full guide here:
- **[Release Process Details](Release.md)**

High-level overview:
- Developers run `pnpm changeset` to describe user-facing changes ([guidelines](.changeset/README.md)).
- Merging the auto-generated version PR makes the Release Coordinator tag the bumped apps. Each tag starts that app's release workflow:
  - **VS Code**: VS Code Marketplace and Open VSX
  - **Jupyter and Streamlit**: PyPI
  - **Desktop (Tauri)**: GitHub release with installers (Linux .deb/.AppImage, macOS .dmg, Windows .exe)
  - **PWA**: GitHub Pages, deployed directly from `main`
- Every Monday, a scheduled job publishes betas of the apps with pending changesets (Marketplace pre-release channel, PyPI `--pre`, desktop GitHub pre-release).
