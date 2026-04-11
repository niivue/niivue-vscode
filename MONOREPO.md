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

We use **Changesets** for independent versioning and automated releases. Read the full guide here:
- **[Release Process Details](Release.md)**

High-level overview:
- Developers run `pnpm changeset` to document changes.
- Merging the auto-generated "Version Packages" PR triggers Release Coordinator to tag the bumped apps and dispatch their per-app release workflows.
- Each per-app workflow publishes to its registry:
  - **VS Code**: VS Code Marketplace & Open VSX
  - **Jupyter & Streamlit**: PyPI
  - **PWA**: GitHub Pages (deployed directly from `main`, no tag involved)
  - **Desktop (Tauri)**: Cross-platform binaries published to GitHub Releases (Linux .deb/.AppImage, macOS .dmg, Windows .msi/.exe)
- Every push to `main` with pending changesets also publishes a per-commit pre-release (Marketplace pre-release channel / PyPI `--pre`).
