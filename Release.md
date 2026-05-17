# Release Process

The `@niivue/monorepo` uses **Independent Versioning** managed by [Changesets](https://github.com/changesets/changesets).

Because this monorepo contains multiple different applications (VS Code extension, Jupyter extension, PWA, Streamlit), they do not share the same version number. However, changes to shared dependencies (like `@niivue/react`) correctly and automatically trigger cascading version bumps for the apps that depend on them.

There are **two release tracks**, each fully automated:

| Track | Trigger | Channel |
| --- | --- | --- |
| **Pre-release** | Every push to `main` that carries pending changesets | VS Code Marketplace pre-release · PyPI (requires `--pre`) |
| **Stable** | Merging the auto-generated "Version Packages" PR | VS Code Marketplace stable · PyPI default |

You do **not** need to enter or exit a "pre-release mode" — both tracks coexist permanently.

---

## 🚀 Standard (stable) releases

### 1. Document your changes
When you finish a feature or bug fix, run the changeset command from the root of the repository:
```bash
pnpm changeset
```
Follow the interactive prompts to:
1. Select the packages you modified (e.g., `@niivue/react`, `niivue`).
2. Choose the type of bump (major, minor, or patch).
3. Write a short description of the change. This text will appear in the `CHANGELOG.md`.

Commit the generated `.changeset/*.md` file with your PR.

### 2. The "Version Packages" PR
When your changes are merged to `main`, **Release Coordinator** (`.github/workflows/release-coordinator.yml`) automatically opens — or updates — a PR titled **"Version Packages"**. It aggregates every unreleased `.changeset/*.md`, bumps versions in the respective `package.json` files, and rewrites the affected `CHANGELOG.md` files.

### 3. Publish
When you are ready to ship a stable release, **merge** the "Version Packages" PR.

The Release Coordinator then:
1. Pushes git tags per package:
   - **VS Code Extension**: `niivue-vscode@<version>`
   - **JupyterLab**: `@niivue/jupyter@<version>`
   - **Streamlit**: `@niivue/streamlit@<version>`
2. These tags trigger the app-specific deployment pipelines (`release_vscode.yml`, `release_jupyterlab.yml`, `release_streamlit.yml`).
3. The apps are published to their respective registries (VS Code Marketplace, Open VSX, PyPI).

*(Note: The **PWA** is deployed to GitHub Pages directly from `main`, outside the tag workflow.)*

---

## 🧪 Pre-releases

`.github/workflows/prerelease.yml` runs on every push to `main` and, if there are pending changeset files, publishes a pre-release across all three published apps. **No manual flag, no mode switch, no remembering to merge anything.**

### How versions are computed

The workflow uses Changesets' `--snapshot` mode to compute "what would the next stable be if I merged the version-packages PR right now?", then re-encodes that base version for each target:

| Target | Format | Example (next stable = `2.10.0`, run #42) |
| --- | --- | --- |
| VS Code Marketplace | `<major>.<next-odd-minor>.<run>` | `2.11.42` |
| Open VSX | same as VS Code | `2.11.42` |
| PyPI (jupyter / streamlit) | `<next-stable>.dev<run>` (PEP 440) | `0.3.0.dev42` |

The odd-minor convention for VS Code follows Microsoft's recommended pattern: pre-release minors are always one greater than the next stable's minor (and odd). Pre-releases share the major but are unambiguously distinct from any stable.

`.devN` versions on PyPI are ignored by plain `pip install <pkg>` — only `pip install --pre <pkg>` resolves them. This matches the VS Code Marketplace separation of stable vs pre-release channels.

### Installing pre-releases

```bash
# VS Code: toggle the "Pre-Release Version" switch on the extension page,
# or via command-line:
code --install-extension KorbinianEckstein.niivue --pre-release

# JupyterLab:
pip install --pre jupyterlab_niivue

# Streamlit:
pip install --pre niivue-streamlit
```

### When no pre-release fires

The workflow exits without publishing when any of:
- The push only touched doc/config files filtered by `paths-ignore` in `prerelease.yml` (e.g. `**.md`, `LICENSE`, `.devcontainer/**`).
- There are no pending `.changeset/*.md` files (e.g. right after the Version Packages PR was merged).
- For a given app: no changeset directly or transitively bumped it. Each app is published independently — a PWA-only changeset will not produce a new VS Code / Jupyter / Streamlit pre-release.

### Cost model

Each pre-release burns one version slot on PyPI per affected package (PyPI does not allow re-uploads of the same version, even after yanking). VS Code Marketplace pre-releases reuse the same channel and do not burn anything user-visible. If pre-release slot consumption on PyPI becomes a concern, the workflow can be switched to TestPyPI by:

1. Adding a new repo secret `TESTPYPI_API_TOKEN`.
2. In `prerelease.yml`, changing `TWINE_PASSWORD: ${{ secrets.PYPI_API_TOKEN }}` to `TWINE_PASSWORD: ${{ secrets.TESTPYPI_API_TOKEN }}` for both Python publish steps.
3. Appending `--repository testpypi` to both `python -m twine upload dist/*` commands.

Users would then need `--index-url https://test.pypi.org/simple/` when installing pre-releases.

---

## Adding a new published app

When a new app joins the monorepo (changesets discovers it automatically from the workspace manifest):

1. Extend `scripts/release/encode-prerelease-versions.mjs` with the target's version-encoding rule, and add a corresponding entry to the emitted `prerelease-targets.json`.
2. Add publish steps to `.github/workflows/prerelease.yml` (pre-release lane), gated on `steps.encode.outputs.<app> == 'true'`.
3. Add a new `release_<app>.yml` (stable lane triggered by the corresponding tag from Release Coordinator).
