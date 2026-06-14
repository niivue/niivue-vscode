# @niivue/viewer-protocol

The transport-agnostic **Viewer-Host Protocol (VHP)** contract for niivue-based
viewers. This package is types-and-constants only - no runtime dependencies, no
niivue, no framework. It is the shared vocabulary; adapters (e.g.
`@niivue/react`) implement it.

See [`VIEWER-HOST-PROTOCOL-PLAN.md`](../../VIEWER-HOST-PROTOCOL-PLAN.md) for the
full design.

## What's here

| Module           | Exports                                                        |
| ---------------- | ------------------------------------------------------------- |
| `envelope.ts`    | `CallEnvelope` / `ResultEnvelope` / `EventEnvelope` (+ guards) |
| `capabilities.ts`| `HostCapabilities`, `defaultBrowserCapabilities`              |
| `document.ts`    | `SceneDocument` (niivue `NVDocument` / `.nvd`, adopted as-is)  |
| `client.ts`      | `ViewerClient`, `JsonPatchOp`, `ViewerEventMap`, `Disposable`  |

## Scope (v1, facade-first)

The envelope and capability handshake are **declared** for the upcoming VS Code
and Jupyter transports (Phase 1b+). v1 ships only the `ViewerClient` facade over
the same-window PWA host, with `.nvd` import/export via `applyDocument` /
`getDocument`. The envelope is kept wire-compatible with niivue/mono's
unpublished `@niivue/web-bridge` so the local-first work converges with niivue
core later.
