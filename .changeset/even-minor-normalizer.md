---
---

Internal: enforce the VS Code Marketplace even-minor convention on the stable
release lane. `changeset version` does plain sequential semver, so a `minor`
bump can land a stable release on an odd minor (this is how `niivue@2.9.0`
shipped); an odd-minor stable sits in the pre-release lane and the next stable
minor bump would collide with already-published `2.11.<run>` pre-releases. The
root `version` script now runs `scripts/release/normalize-vscode-even-minor.mjs`
right after `changeset version` to round an odd-minor VS Code stable up to the
next even minor (and retitle the matching CHANGELOG heading), with unit tests
wired into CI (`pnpm versions:normalize:test`).

Empty frontmatter intentional: release tooling + docs only, no package version
bump or runtime behavior change.
