# Project tools

- **Turborepo**: Build orchestration and caching system
- **pnpm**: Package manager with workspace support
- **Vite**: Build tool for React components and PWA
- **TypeScript**: Type safety with project references across monorepo
- **ESLint**: Code quality and formatting
- **Preact**: Lightweight React alternative for components
- **Tailwind CSS**: Styling framework

# Project structure

Modern monorepo managed with Turborepo and pnpm workspaces:

## Applications (`apps/`)
- **`apps/vscode/`**: VS Code extension for NIfTI file viewing
- **`apps/pwa/`**: Progressive Web App (slim wrapper)
- **`apps/jupyter/`**: JupyterLab extension
- **`apps/streamlit/`**: Streamlit component

## Packages (`packages/`)
- **`packages/niivue-react/`**: Core React components library
  - Reusable NiiVue viewer components
  - Used by all applications

## Development
- Use `pnpm` for package management
- Use `turbo build` for orchestrated builds
- TypeScript project references enable incremental compilation
- Workspace dependencies use `workspace:*` protocol
