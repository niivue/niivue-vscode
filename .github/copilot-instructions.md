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

## Changesets — documenting changes for releases

This project uses [Changesets](https://github.com/changesets/changesets) for versioning and changelogs. **Every PR that modifies code in `packages/` or `apps/` must include a changeset file.**

### When to add a changeset

Add a changeset whenever your changes affect package logic, public APIs, bug fixes, or anything user-visible. Pure documentation or CI/tooling-only changes that don't touch `packages/` or `apps/` source code do not require a changeset.

### How to create a changeset

The Changeset CLI (`npx changeset add`) is interactive and requires a terminal UI — AI agents cannot run it directly. Instead, **write the changeset file directly** in `.changeset/` using the format below. Choose a short, unique filename (e.g. `fix-slice-navigation.md`).

```markdown
---
'<package-name>': patch
---

Short, user-facing description of what changed (this becomes the CHANGELOG entry). Avoid internal jargon; write for someone consuming the package.
```

Replace `patch` with `minor` (new feature) or `major` (breaking change) as appropriate. List **every** package affected by the change. Use the `name` field from each package's `package.json`:

| Directory | Package name |
|---|---|
| `packages/niivue-react/` | `@niivue/react` |
| `apps/vscode/` | `niivue` |
| `apps/jupyter/` | `@niivue/jupyter` |
| `apps/streamlit/` | `@niivue/streamlit` |
| `apps/pwa/` | `@niivue/pwa` |

### Choosing the bump type

- **patch** — bug fixes, refactors, dependency updates
- **minor** — new features, non-breaking additions
- **major** — breaking changes

### Example

```markdown
---
'@niivue/react': minor
'niivue': minor
---

Add keyboard shortcuts for slice navigation.
```

When changes touch `packages/niivue-react/`, also bump every app that depends on it.

Make sure the `.changeset/*.md` file is included (staged and committed) as part of the PR.
