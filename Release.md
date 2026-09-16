# Release Process

Each app in this monorepo has its own version and is released only when a change
reaches it. Versions and changelogs are managed by
[Changesets](https://github.com/changesets/changesets); how to write a changeset
is described in [.changeset/README.md](.changeset/README.md).

| App | Package | Stable release | Beta |
| --- | --- | --- | --- |
| VS Code extension | `niivue` | VS Code Marketplace, Open VSX | Marketplace and Open VSX pre-release, `<major>.<odd minor>.<run>` |
| JupyterLab extension | `@niivue/jupyter` | PyPI `jupyterlab_niivue` | PyPI `<next stable>.dev<run>` |
| Streamlit component | `@niivue/streamlit` | PyPI `niivue-streamlit` | PyPI `<next stable>.dev<run>` |
| Desktop app | `@niivue/tauri` | GitHub release with installers, marked latest | GitHub pre-release, `<next stable>-beta.<run>` |
| Web app | `@niivue/pwa` | GitHub Pages, deployed from `main` | none |

The bundled libraries (`@niivue/react`, `@niivue/viewer-protocol`) and the
Streamlit frontend are versioned and tagged but never published. Every app
declares the libraries it bundles as `dependencies`, so a change to a library
releases each app that ships it.

## Stable releases

1. A pull request that changes something users notice adds a changeset
   (`pnpm changeset`).
2. After it merges, the Release Coordinator (`release-coordinator.yml`) opens or
   updates the **chore(release): version packages** pull request. It runs the
   root `version` script:
   - `changeset version` bumps versions and writes the changelogs
   - `normalize-vscode-even-minor.mjs` moves the VS Code version to an even minor
   - `polish-changelogs.mjs` tidies the new changelog sections
   - `sync-pyproject-versions.mjs` copies the Streamlit version into `pyproject.toml`
3. CI runs on the version PR like on any other. Review the versions and
   changelogs, then merge it.
4. The coordinator runs `changeset publish`, which tags every bumped package as
   `<package>@<version>`. Each tag starts that app's release workflow:
   `release_vscode.yml`, `release_jupyterlab.yml`, `release_streamlit.yml` or
   `release_desktop.yml`. All of them can also be started by hand
   (`workflow_dispatch`) to repeat a release of the version in `package.json`.

The desktop release takes its notes from the new section of
`apps/desktop-tauri/CHANGELOG.md`. Tauri reads the installer version from
`src-tauri/tauri.conf.json` and `Cargo.toml`, which Changesets does not bump,
so the workflow stamps the version from `package.json` into them before
building (`set-desktop-version.mjs`).

### Version rules

- **VS Code**: the Marketplace allows only `M.m.p` and recommends even minors for
  stable releases and odd minors for pre-releases. `normalize-vscode-even-minor.mjs`
  rounds an odd minor up (`2.11.0` becomes `2.12.0`). A stable release may be
  numbered below the current beta (`2.10.0` after `2.11.149`): VS Code keeps
  beta users on the beta until a higher stable ships. Open VSX still labels the
  highest version `latest` (eclipse-openvsx/openvsx#1675); VS Code and its
  forks are not affected.
- **PyPI**: PEP 440. Betas are `.devN`, which `pip install` skips unless `--pre`
  is given.
- **Desktop**: betas are `<next stable>-beta.<run>`, which sorts below that
  stable. Windows gets the NSIS installer only; MSI rejects pre-release versions.

## Betas

`prerelease.yml` runs every Monday at 03:00 UTC, and on demand from the Actions
tab. It skips a commit the previous successful run already built, and does
nothing when no changesets are pending. Otherwise it:

1. reads the release plan (`changeset status --output`),
2. runs `changeset version` and `polish-changelogs.mjs` in the checkout, so the
   betas carry the changelog of the next stable (nothing is committed),
3. encodes the beta version of each app in that plan
   (`encode-prerelease-versions.mjs`, which also retitles the VS Code changelog
   section to `2.11.<run> (pre-release)`),
4. builds and publishes each of those apps in its own job. The desktop
   installers are built by `release_desktop.yml` on a platform matrix and
   published as a GitHub pre-release.

A failing registry does not hold back the other apps. Every publish skips a
version that is already out, so a failed job can be re-run on its own
(**Re-run failed jobs**); the stable release workflows behave the same way.
Steps 1 to 3 live in the `prepare-prerelease` composite action, which every
job runs.

`<run>` is the run number of `prerelease.yml`. Renaming the workflow file
restarts it at 1, which would number new VS Code betas below published ones.

Installing betas:

```bash
code --install-extension KorbinianEckstein.niivue --pre-release
pip install --pre jupyterlab_niivue
pip install --pre niivue-streamlit
```

Desktop betas are on the [releases page](https://github.com/niivue/niivue-vscode/releases).

## Changelogs

Each package's `CHANGELOG.md` is written by Changesets with
`scripts/release/changelog.mjs`:

- an entry is the changeset summary with a link to the pull request that added it
- a library change appears in the changelog of every app that bundles it,
  instead of an "Updated dependencies" line
- `polish-changelogs.mjs` groups the new section under **Breaking changes**,
  **New features** and **Fixes and improvements**, and removes repeated entries

Users see them in the Changelog tab of the Marketplace, Open VSX and VS Code
(the file ships in the extension), through the Changelog link on PyPI, and in
the desktop release notes. `pnpm release:test` runs the unit tests of these
scripts; CI runs it too.

## Release app

Pushes, pull requests and tags made with a workflow's `GITHUB_TOKEN` start no
other workflows. The Release Coordinator and the Dependabot auto-merge
therefore act through a GitHub App, so the version PR gets CI, release tags
start the release workflows, and Dependabot merges run the workflows on `main`.

One-time setup, by a repository admin:

1. Under your GitHub account's **Settings > Developer settings > GitHub Apps**,
   create a new app. Deactivate the webhook. Grant the repository permissions
   **Contents: Read and write** and **Pull requests: Read and write**, nothing
   else. Allow installation on **any account**.
2. Note the **Client ID** and generate a **private key**.
3. From the app's **Install App** page, install it on the `niivue` organization
   with access to only `niivue-vscode`.
4. In the repository settings, add the Actions variable `RELEASE_APP_CLIENT_ID`,
   the Actions secret `RELEASE_APP_PRIVATE_KEY` (the whole `.pem` file), and
   the same private key as the Dependabot secret `RELEASE_APP_PRIVATE_KEY`.

The key does not expire. To rotate it, generate a new key, update both secrets,
then delete the old key in the app settings.

## Adding a published app

1. Mark the app `"private": true` so `changeset publish` tags it without
   publishing to npm, and list the workspace packages it bundles in
   `dependencies`.
2. Add `.github/workflows/release_<app>.yml`, triggered by the tag
   `<package name>@*` and by `workflow_dispatch`.
3. Add its beta version rule to `encode-prerelease-versions.mjs` and publish
   steps to `prerelease.yml`.
4. If its build reads the version from a file Changesets does not bump, stamp
   it before building, as `set-desktop-version.mjs` does for the desktop app, or
   add it to `sync-pyproject-versions.mjs` for a static `pyproject.toml` version.
