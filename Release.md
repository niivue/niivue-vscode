# Release Process

The `@niivue/monorepo` uses **Independent Versioning** managed by [Changesets](https://github.com/changesets/changesets). 

Because this monorepo contains multiple different applications (VS Code extension, Jupyter extension, PWA, Streamlit), they do not share the same version number. However, changes to shared dependencies (like `@niivue/react`) correctly and automatically trigger cascading version bumps for the apps that depend on them.

---

## 🚀 Standard Releases

### 1. Document your changes
When you finish a feature or bug fix, run the changeset command from the root of the repository:
```bash
# Inside the dev-container
pnpm changeset
```
Follow the interactive prompts to:
1. Select the packages you modified (e.g., `@niivue/react`, `niivue`).
2. Choose the type of bump (major, minor, or patch).
3. Write a short description of the change. This text will appear in the `CHANGELOG.md`.

Commit the generated `.changeset/*.md` file to your branch and push/merge it.

### 2. The "Version Packages" PR
When your changes are merged to the `main` branch, a GitHub Action called **Release Coordinator** will automatically open (or update) a Pull Request named **"Version Packages"**.

This PR aggregates all unreleased `.changeset/*.md` files, bumps the versions in the respective `package.json` files, and updates the `CHANGELOG.md` files.

### 3. Publish
When you are ready to release, simply **Merge** the "Version Packages" PR.

The Release Coordinator will:
1. Push git tags matching the specific prefix for that package.
   - **VS Code Extension**: `niivue-vscode@<version>`
   - **JupyterLab**: `@niivue/jupyter@<version>`
   - **Streamlit**: `@niivue/streamlit@<version>`
2. These tags trigger the app-specific deployment pipelines (`release_vscode.yml`, `release_jupyterlab.yml`, `release_streamlit.yml`).
3. The apps are published to their respective stores (VS Code Marketplace, PyPI, Open VSX).

*(Note: The **PWA** is currently deployed automatically to GitHub Pages outside of this tag workflow).*

---

## 🧪 Pre-Releases (Betas, Release Candidates)

Changesets natively supports releasing pre-release versions.

### Entering Pre-release Mode
To start a pre-release cycle, run this locally on `main`:
```bash
# Example: starting a "beta" cycle
pnpm changeset pre enter beta
```
This restricts the Changeset bot to only generate pre-release versions. Commit the generated `.changeset/pre.json` file.

### Publishing Pre-releases
Follow the standard release process:
1. Make changes and run `pnpm changeset`.
2. The "Version Packages" PR will now generate versions like `niivue-vscode@2.8.0-beta.0`.
3. When you merge this PR, the Coordinator pushes the pre-release tag (e.g., `niivue-vscode@2.8.0-beta.0`).

### Pre-release CI/CD Behavior
The app-specific deployment pipelines detect the pre-release tag (specifically looking for `-beta.`, `-rc.`, or `-alpha.`) and alter their behavior automatically:
- **VS Code**: Publishes using the `--pre-release` flag to the Marketplace.
- **Jupyter & Streamlit**: Publishes using `twine upload --repository testpypi` to TestPyPI instead of the production PyPI.

### Exiting Pre-release Mode
Once the beta is stable and you want to do a full release, run:
```bash
pnpm changeset pre exit
```
Commit the changes. The next "Version Packages" PR will graduate the packages from `1.2.0-beta.x` to a stable `1.2.0`.
