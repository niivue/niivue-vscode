---
---

Internal: test-coverage additions across `apps/vscode`, `apps/jupyter`, and
`packages/niivue-react`. No runtime behavior change.

- Fix `ci.yml` jupyter coverage download path so the artifact lands under
  `apps/jupyter/coverage/unit/` (the aggregator's walk requires a
  `coverage` path segment).
- `apps/vscode`: add unit tests for `dispose.ts`, `html.ts` (CSP shape +
  nonce uniqueness as a security guardrail), and `HoverProvider.ts`
  (regex link detection across all 17 supported extensions).
- `packages/niivue-react`: add unit tests for `utility.ts` (isImageType,
  getMetadataString, getNumberOfPoints, getNames), `matchesShortcut` in
  `constants/keyboardShortcuts.ts`, and `ReadyStateManager`.
- `apps/jupyter`: cover the remaining `url-utils.ts` exports
  (`getJupyterUrl`, `getMhdPairedRawBasename`, `getMhdPairedRawPath`,
  `fetchArrayBuffer`, `fetchJson`), reaching 100% statement coverage on
  that file.

Empty frontmatter intentional: tests-only, no version bump.
