# Release Process

The `@niivue/monorepo` uses **Independent Versioning** managed by [Changesets](https://github.com/changesets/changesets).

Because this monorepo contains multiple different applications (VS Code extension, Jupyter extension, PWA, Streamlit), they do not share the same version number. However, changes to shared dependencies (like `@niivue/react`) correctly and automatically trigger cascading version bumps for the apps that depend on them.

There are **two release tracks**, each fully automated:

| Track | Trigger | Channel |
| --- | --- | --- |
| **Pre-release** | Daily at 03:00 UTC, if `main` carries pending changesets (max one per day) | VS Code Marketplace pre-release · PyPI (requires `--pre`) · GitHub Releases (desktop installers) |
| **Stable** | Merging the auto-generated "Version Packages" PR | VS Code Marketplace stable · PyPI default |

You do **not** need to enter or exit a "pre-release mode" — both tracks coexist permanently.

> **Status note (May 2026):** the stable release flow described below was rebuilt around `changesets/action` and has not yet shipped a full stable release end-to-end. The pre-release lane has been running successfully for some time. The first merged Version Packages PR will validate the stable path; if anything regresses, check that section first.

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
When your changes are merged to `main`, **Release Coordinator** (`.github/workflows/release-coordinator.yml`) automatically opens — or updates — a PR titled **"Version Packages"**. It aggregates every unreleased `.changeset/*.md`, bumps versions in the respective `package.json` files, rewrites the affected `CHANGELOG.md` files, and (via the root `version` script) keeps `apps/streamlit/pyproject.toml` in lock-step with its `package.json`. Review the diff to confirm the next versions look right before merging.

### 3. Publish
When you are ready to ship a stable release, **merge** the "Version Packages" PR.

The Release Coordinator then:

1. **Creates git tags** per private app package via `changeset publish`:
   - **VS Code Extension**: `niivue@<version>` (matches the package's npm name)
   - **JupyterLab**: `@niivue/jupyter@<version>`
   - **Streamlit**: `@niivue/streamlit@<version>`

   The apps are marked `"private": true` in their `package.json` so npm publish is skipped. Tags are still created because `.changeset/config.json` opts into `privatePackages.tag: true`.

2. **Dispatches each app's release workflow** for the apps whose tag was just created in this run. The coordinator snapshots `git tag -l` before and after `changeset publish`, computes the diff, and matches new tags against each registered app (e.g. a new `niivue@*` tag → dispatch `release_vscode.yml --ref <tag>`). This uses `gh workflow run` rather than the tag-push trigger, because GitHub's recursion guard prevents tags pushed by `GITHUB_TOKEN` from triggering other workflows. `workflow_dispatch` is the documented exception. The tag-based detection is robust to the case where the version bump and the publish happen in different coordinator runs (e.g. an earlier publish failed and left versions un-tagged; a later push then triggers the catch-up publish).

3. The per-app workflows (`release_vscode.yml`, `release_jupyterlab.yml`, `release_streamlit.yml`) each check out `main`, build, and publish the version recorded in `apps/<app>/package.json` (or `pyproject.toml` for Python apps) to the relevant registry:
   - VS Code → VS Code Marketplace and Open VSX
   - JupyterLab → PyPI
   - Streamlit → PyPI

   The per-app workflows also accept a matching tag push and `workflow_dispatch`, so a maintainer can manually trigger a re-release or hotfix without going through Release Coordinator.

4. **The desktop app** (`release_desktop.yml`) is dispatched the same way when a `@niivue/desktop@<version>` tag is created, but instead of publishing to a registry it builds native installers with Tauri and attaches them to a GitHub Release created from the tag. One wrinkle: Tauri reads the bundle/installer version from `src-tauri/tauri.conf.json` (which overrides `Cargo.toml`), while changesets only bumps `apps/desktop-tauri/package.json` and never touches the Tauri manifests. So before `tauri build`, the stable lane re-stamps all three (`package.json`, `tauri.conf.json`, `Cargo.toml`) from `package.json`'s version via `scripts/release/set-desktop-version.mjs`, so the installer is labeled with the tagged version rather than whatever was last committed to `tauri.conf.json`. (The pre-release lane stamps the same three manifests, but from the explicit beta version `prerelease.yml` passes in via the `version` input; see [Pre-releases](#-pre-releases).)

*(Note: The **PWA** is deployed to GitHub Pages directly from `main`, outside the tag workflow.)*

### Version format conventions

Stable versions ship as-is — whatever changesets computed. No re-encoding is needed:

- **VS Code Marketplace / Open VSX**: bare semver `M.m.p`. The Marketplace recommends (but does not enforce) that **stable releases use an even minor and pre-releases use an odd minor**. Changesets does not enforce this, so when you write a changeset, prefer a `minor` bump that lands on an even minor. If you happen to ship a stable with an odd minor it still works — the Marketplace orders by version string, so the next pre-release scheme will skip ahead to the next odd minor automatically (see `encode-prerelease-versions.mjs`).
- **PyPI** (jupyter and streamlit): bare PEP 440 `M.m.p`. Pre-releases use `.devN` (see below) which `pip install` ignores by default.

---

## 🧪 Pre-releases

`.github/workflows/prerelease.yml` runs on a daily schedule (03:00 UTC) and, if there are pending changeset files, publishes a pre-release across all four published apps (VS Code, JupyterLab, Streamlit, and the Tauri desktop app). Running on a timer rather than on every push caps pre-releases at **one per day**, regardless of how many times `main` is pushed (frequent dependabot merges previously produced a beta each). **No manual flag, no mode switch, no remembering to merge anything** — and you can trigger the workflow manually (`workflow_dispatch`) to force an off-schedule beta.

The desktop app is the exception to the "one workflow does everything" rule: because its installers need a per-OS build matrix and Rust toolchains, `prerelease.yml` delegates to the reusable `release_desktop.yml` (`workflow_call`) when a changeset bumped `@niivue/desktop`. That job stamps the computed beta version into the desktop manifests, builds the Linux/macOS/Windows installers, and attaches them to the same GitHub pre-release. The bundles land a few minutes after the rest, once the cross-platform build finishes.

### How versions are computed

The workflow asks Changesets for the pending release plan via `pnpm changeset status --output=changeset-status.json` — that file lists `{name, oldVersion, newVersion, type}` for every package that would be bumped if the Version Packages PR merged right now. The encoder reads that plan and rewrites each affected app's manifest to the per-target format:

> **Why not `changeset version --snapshot`?** Changesets' snapshot mode discards the next-stable computation and always writes `0.0.0-<tag>-<datetime>` as the base (see [changesets docs](https://github.com/changesets/changesets/blob/main/docs/snapshot-releases.md)). Driving the pre-release encoder off that string yielded `0.1.<run>` for VS Code (the only `niivue` pre-release that ever shipped under the broken path was `0.1.46` from PR #107). The `status --output` flow recovers the real next-stable and is also non-mutating, so the changeset files survive for the eventual stable release.


| Target | Format | Example (next stable = `2.10.0`, run #42) |
| --- | --- | --- |
| VS Code Marketplace | `<major>.<next-odd-minor>.<run>` | `2.11.42` |
| Open VSX | same as VS Code | `2.11.42` |
| PyPI (jupyter / streamlit) | `<next-stable>.dev<run>` (PEP 440) | `0.3.0.dev42` |
| Desktop (Tauri) | `<major>.<minor>.<run>` (plain numeric) | `0.2.42` (next stable `0.2.0`) |

Desktop uses a plain numeric version rather than a `-beta.<run>` suffix because the Windows MSI and macOS bundlers reject SemVer pre-release identifiers. The beta is marked solely by living on the GitHub pre-release; the installer metadata stays a valid `M.m.p`.

The odd-minor convention for VS Code follows Microsoft's recommended pattern: pre-release minors are always one greater than the next stable's minor (and odd). Pre-releases share the major but are unambiguously distinct from any stable.

If the previous stable already used an odd minor (e.g. you accidentally shipped stable `2.9.0`), the encoder skips ahead one more step (`2.11.<run>`) to avoid collision with prior pre-releases on the same minor.

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

For the **desktop app**, download the installer for your platform (`.dmg`, `.msi`/`.exe`, `.deb`/`.AppImage`) from the latest pre-release on the [Releases page](https://github.com/niivue/niivue-vscode/releases).

### When no pre-release fires

The workflow exits without publishing when any of:
- There are no pending `.changeset/*.md` files at the scheduled run (e.g. right after the Version Packages PR was merged, or a day of doc-only commits that added no changeset).
- For a given app: no changeset directly or transitively bumped it. Each app is published independently — a PWA-only changeset will not produce a new VS Code / Jupyter / Streamlit / desktop pre-release. The desktop installers only build when `@niivue/desktop` itself was bumped.

### Cost model

Each pre-release burns one version slot on PyPI per affected package (PyPI does not allow re-uploads of the same version, even after yanking). VS Code Marketplace pre-releases reuse the same channel and do not burn anything user-visible. If pre-release slot consumption on PyPI becomes a concern, the workflow can be switched to TestPyPI by:

1. Adding a new repo secret `TESTPYPI_API_TOKEN`.
2. In `prerelease.yml`, changing `TWINE_PASSWORD: ${{ secrets.PYPI_API_TOKEN }}` to `TWINE_PASSWORD: ${{ secrets.TESTPYPI_API_TOKEN }}` for both Python publish steps.
3. Appending `--repository testpypi` to both `python -m twine upload dist/*` commands.

Users would then need `--index-url https://test.pypi.org/simple/` when installing pre-releases.

Desktop pre-releases burn no registry slots (the installers are just GitHub release assets), but each one runs a full four-platform Tauri build, so they only run on days a `@niivue/desktop` changeset is pending — not on every scheduled run.

---

## Why apps are private packages

All three published apps (`apps/vscode`, `apps/jupyter`, `apps/streamlit`) are marked `"private": true` in their `package.json`. This is deliberate:

- They are not npm packages. VS Code ships via the Marketplace, the Python apps ship via PyPI.
- Without `private`, `changeset publish` would attempt to push them to npm, which fails with `ENEEDAUTH` and (in the case of `apps/vscode`, whose package name is the bare `niivue`) would collide with an unrelated upstream library on npm.
- `.changeset/config.json` sets `privatePackages.tag: true` so the apps still get versioned and tagged by changesets — just not pushed to npm.

---

## Streamlit pyproject.toml version sync

`apps/streamlit/pyproject.toml` uses setuptools with a static `version = "<X>"` line, while changesets bumps `apps/streamlit/package.json`. The two are kept in lock-step by `scripts/release/sync-pyproject-versions.mjs`, which the root `version` script runs after `changeset version`:

```jsonc
// package.json
"version": "changeset version && node scripts/release/sync-pyproject-versions.mjs && pnpm install --no-frozen-lockfile"
```

The script is idempotent — running it when versions are already in sync is a no-op. The resulting `pyproject.toml` diff is committed to the Version Packages PR.

JupyterLab (`apps/jupyter`) does not need this — its `pyproject.toml` declares `dynamic = ["version", ...]` and derives version from `package.json` at build time via the `hatch-nodejs-version` plugin.

---

## Adding a new published app

When a new app joins the monorepo (changesets discovers it automatically from the workspace manifest):

1. Mark `apps/<new>/package.json` as `"private": true` if it ships to a non-npm registry, so `changeset publish` skips npm but still tags it (thanks to `privatePackages.tag: true`).
2. Add a new `.github/workflows/release_<app>.yml` triggered by `<package-name>@*` tag push and by `workflow_dispatch`. Be careful to use the package's *npm name*, not its directory name — that's what changesets puts in the tag.
3. Extend `scripts/release/encode-prerelease-versions.mjs` with the target's version-encoding rule, and add a corresponding entry to the emitted `prerelease-targets.json`.
4. Add publish steps to `.github/workflows/prerelease.yml` (pre-release lane), gated on `steps.encode.outputs.<app> == 'true'`. If the app needs a multi-platform build (like the Tauri desktop app), follow the desktop pattern instead: expose the version as a `prerelease` job output, make `release_<app>.yml` reusable via `workflow_call`, and add a `needs: prerelease` job in `prerelease.yml` that calls it and attaches the artifacts to the `prerelease-<sha>` release.
5. Add a dispatch line to `release-coordinator.yml`'s "Dispatch per-app release workflows" step so the stable lane fires when the version bumps:
   ```bash
   dispatch <app-dir> release_<app>.yml
   ```
6. If the app is a Python app using setuptools (or any backend without dynamic versioning), add it to the `targets` array in `scripts/release/sync-pyproject-versions.mjs` so its `pyproject.toml` stays in sync with `package.json`.
7. If the app's build reads its version from a manifest changesets does **not** bump (e.g. Tauri reads `src-tauri/tauri.conf.json` / `Cargo.toml`, not `package.json`), add a stamping step to `release_<app>.yml` for the **stable** lane: derive the version from `package.json` and rewrite the build manifests before building, mirroring `scripts/release/set-desktop-version.mjs`. Otherwise the stable build ships whatever version was last committed to that manifest rather than the tagged one. The pre-release lane already passes an explicit `version`, so only the stable lane (empty `version` input) needs the package.json-derived fallback.
