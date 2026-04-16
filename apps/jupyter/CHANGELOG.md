# @niivue/jupyter

## 0.2.7

### Patch Changes

- 23028fd: shift+drop adds files as overlays to the last canvas instead of creating new ones
  overlay handler resolves index -1 to last canvas with bounds check
  HeaderBox now uses signal effect instead of stale useEffect dependency
  added onVolumeUpdated callback to ExtendedNiivue, called after load
- 79610b8: Initial configuration for automated independent releases via Changesets.
