/**
 * Message envelope for the Viewer-Host Protocol transport layer.
 *
 * Wire-compatible with niivue/mono's `@niivue/web-bridge` envelope
 * (`{ kind: 'call' | 'result' | 'event', ... }`) so local-first work converges
 * with niivue core later (VHP plan sections 9 and 12). web-bridge is
 * unpublished, so the shape is re-declared here rather than imported.
 *
 * v1 is facade-first: these are declared for the upcoming VS Code / Jupyter
 * transports (Phase 1b+). The same-window PWA host calls the `ViewerClient`
 * facade directly and does not yet move messages over the wire, so nothing in
 * this file is exercised at runtime in v1.
 */

/** A request from one side to invoke a named method on the other. */
export interface CallEnvelope<P = unknown> {
  kind: 'call'
  /** Correlates a call with its result. Unique per connection. */
  id: string
  /** Method name on the host services or viewer client. */
  method: string
  payload?: P
}

/** The reply to a `CallEnvelope`, carrying either a payload or an error. */
export interface ResultEnvelope<R = unknown> {
  kind: 'result'
  /** Matches the originating `CallEnvelope.id`. */
  id: string
  /** `false` when the call threw; `error` is then populated. */
  ok: boolean
  payload?: R
  error?: { message: string; code?: string; data?: unknown }
}

/** A fire-and-forget notification (no reply expected). */
export interface EventEnvelope<P = unknown> {
  kind: 'event'
  /** Event name, e.g. 'locationChanged'. */
  name: string
  payload?: P
}

export type Envelope = CallEnvelope | ResultEnvelope | EventEnvelope

export function isCall(e: Envelope): e is CallEnvelope {
  return e.kind === 'call'
}

export function isResult(e: Envelope): e is ResultEnvelope {
  return e.kind === 'result'
}

export function isEvent(e: Envelope): e is EventEnvelope {
  return e.kind === 'event'
}
