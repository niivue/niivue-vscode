# @niivue/pwa

## 0.1.0

### Minor Changes

- 62ecdef: Add keyboard shortcuts

### Patch Changes

- 23028fd: shift+drop adds files as overlays to the last canvas instead of creating new ones
  overlay handler resolves index -1 to last canvas with bounds check
  HeaderBox now uses signal effect instead of stale useEffect dependency
  added onVolumeUpdated callback to ExtendedNiivue, called after load
- 79610b8: Initial configuration for automated independent releases via Changesets.
- Updated dependencies [27432cf]
- Updated dependencies [23028fd]
- Updated dependencies [79610b8]
- Updated dependencies [62ecdef]
  - @niivue/react@0.2.0
