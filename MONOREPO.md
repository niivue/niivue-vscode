# NiiVue Monorepo

A modern monorepo containing multiple NiiVue applications and packages for neuroimaging visualization.

## Structure

### Applications (`apps/`)

- **`vscode/`** - VS Code extension for viewing NIfTI files
- **`pwa/`** - Progressive Web App (slim wrapper around niivue-react)
- **`jupyter/`** - JupyterLab extension
- **`streamlit/`** - Streamlit component

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
pnpm --filter @niivue/vscode watch

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

## Deployment

Each app has its own deployment strategy:
- **VSCode**: Published to VS Code Marketplace
- **PWA**: Deployed as static site
- **Jupyter**: Published to PyPI
- **Streamlit**: Published to PyPI
