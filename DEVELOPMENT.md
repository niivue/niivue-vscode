# Development Guide - NiiVue Monorepo

This guide covers development setup and workflows for the NiiVue monorepo containing VS Code, JupyterLab, PWA, and Streamlit projects.

## Prerequisites

- Node.js
- pnpm
- Python 3.8+ (for JupyterLab and Streamlit projects)
- VS Code (recommended)

## Dev Container Setup (Recommended)

The easiest way to get started is using the dev container:

1. **Install Prerequisites**:
   - [Docker](https://www.docker.com/products/docker-desktop)
   - [VS Code](https://code.visualstudio.com/)
   - [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

2. **Open in Container**:
   - Clone the repository
   - Open in VS Code
   - Click "Reopen in Container" when prompted
   - The dev container will automatically install all dependencies

## Manual Setup

### 1. Clone and Install

```bash
git clone https://github.com/niivue/niivue-vscode.git
cd niivue-vscode
pnpm install
```

### 2. Build All Projects

```bash
pnpm build
```

## Project Structure

```
niivue-vscode/
├── apps/
│   ├── vscode/          # VS Code extension
│   ├── jupyter/         # JupyterLab extension
│   ├── pwa/             # Progressive Web App
│   └── streamlit/       # Streamlit component
├── packages/
│   └── niivue-react/    # Shared React components
└── turbo.json           # Turborepo configuration
```

## Development Workflows

### Hot Reload Development (PWA)

For live development with React package changes automatically reflected:

```bash
pnpm dev:source
```

This runs:

- TypeScript type generation in watch mode for `@niivue/react`
- PWA dev server with Vite configured to use React source directly

Changes in `packages/niivue-react/src/` trigger hot reload in the PWA.

### Project-Specific Development

Each project has its own development workflow. See individual guides:

- **VS Code**: [apps/vscode/DEVELOPMENT.md](apps/vscode/DEVELOPMENT.md)
- **JupyterLab**: [apps/jupyter/DEVELOPMENT.md](apps/jupyter/DEVELOPMENT.md)
- **PWA**: [apps/pwa/DEVELOPMENT.md](apps/pwa/DEVELOPMENT.md)
- **Streamlit**: [apps/streamlit/README.md](apps/streamlit/README.md)

## Turborepo

The monorepo uses Turborepo for task orchestration and caching:

```bash
# Build with caching
turbo build
```

## pnpm Workspaces

```bash
# Install dependencies for all workspaces
pnpm install

# Run command in specific workspace
pnpm --filter @niivue/vscode build
```

## @niivue/react Package

The core React components are shared across all applications.

## Testing

A few tests exist for the react and PWA parts.

```bash
# Run all tests
pnpm test
```

## Linting and Formatting

```bash
# Lint all projects
pnpm lint

# Format code
pnpm format

# Check formatting
pnpm format:check

# Type check
pnpm type-check

# Check dependency versions
pnpm versions:check

# Fix dependency version mismatches
pnpm versions:fix
```

### Automatic Formatting on Commit

This repository uses **Husky** and **lint-staged** to automatically format code before commits:

- **What happens**: When you commit, prettier automatically formats all staged files
- **Files affected**: `.js`, `.jsx`, `.ts`, `.tsx`, `.json`, `.css`, `.md`
- **No action needed**: The formatting happens automatically - you don't need to run `pnpm format` manually

If you need to bypass the hook (not recommended):

```bash
git commit --no-verify -m "your message"
```

The hooks are set up automatically when you run `pnpm install`.

## Contributing

Issues and pull-requests are welcome.

## Resources

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [NiiVue Core Library](https://github.com/niivue/niivue)
- [VS Code Extension API](https://code.visualstudio.com/api)
- [JupyterLab Extension Guide](https://jupyterlab.readthedocs.io/en/stable/extension/extension_dev.html)
