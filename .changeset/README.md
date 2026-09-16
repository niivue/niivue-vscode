# Changesets

A changeset is a short Markdown file that says which packages a pull request
changes and how. `pnpm changeset` writes one for you. At release time the
summaries become the changelogs users read: the Changelog tab of the VS Code
Marketplace, Open VSX and VS Code, the PyPI project links, and the desktop app's
GitHub release notes. See [Release.md](../Release.md) for how releases work.

```md
---
'@niivue/react': minor
'niivue': minor
---

Save the viewer tiles as a PNG figure with the new Screenshot button.
```

## When to add one

Add a changeset when a user of an app would notice the change: a new feature,
a new file format, a fix, a changed default, a removed option.

Skip it for tests, CI, refactoring, developer docs, and dependency updates that
change nothing users see. No changeset means no entry and no release.

## Which packages to name

- Name the package where the code changed. Apps that bundle it get a release
  and the entry automatically, under "New features" for a `minor` and "Fixes
  and improvements" for a `patch`: `@niivue/react` reaches the VS Code
  extension (`niivue`), `@niivue/jupyter`, `@niivue/streamlit`, `@niivue/tauri`
  and `@niivue/pwa`.
- Apps receive a library change as a patch release. Name an app as well, with
  `minor`, when a new feature should make its next release a minor one.
- A change that only concerns one app names only that app, even when the code
  lives in `@niivue/react`.
- Bump levels, as users see them:
  - `patch`: fixes and small improvements
  - `minor`: new features, formats or settings
  - `major`: users lose something, such as a setting, a file format or a
    supported platform. Reserve it for that.

## How to write the summary

1. Write for someone using the app, not for someone reading the code. Say what
   they can do now or what no longer goes wrong. Leave out class names, file
   paths, internal package names and how the fix works; the pull request
   has those.
2. One change per changeset, in one or two sentences. Start with a verb:
   "Add", "Fix", "Show", "Open".
3. A summary of a shared package appears in every app that bundles it, so it
   must read correctly in each of them. If part of the change applies to some
   apps only, name them in the sentence ("VS Code and JupyterLab save through
   their own dialog").
4. Markdown works, but keep it to inline code and the occasional bold menu
   name. The pull request link is added automatically.

| Instead of | Write |
| --- | --- |
| Refactor `loadVolume` to sniff DICOM magic bytes | Open DICOM files that have no file extension |
| Fix race between attachToCanvas and loadVolume | Fix "Failed to load image" when adding several images in a row |
| Bump @niivue/niivue to 1.0.0-rc.13 | Update the NiiVue core to 1.0, which renders with WebGPU where available |
