import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * `readyStateManager` is a module-level singleton: once imported, the same
 * instance is reused across imports for the lifetime of the module cache.
 * Without intervention, one test's mutations (`.eventListenerReady = true`)
 * would leak into the next. `vi.resetModules()` clears the module cache so
 * the next `import('../readyState')` re-evaluates the module and constructs
 * a fresh instance.
 */

beforeEach(() => {
  vi.resetModules()
  // The module checks window.vscode at message-send time, so we set it before importing.
  ;(globalThis as any).window = { vscode: { postMessage: vi.fn() } }
})

afterEach(() => {
  delete (globalThis as any).window
})

async function freshManager() {
  const mod = await import('../readyState')
  return mod.readyStateManager
}

describe('ReadyStateManager', () => {
  it('does not send when only DOM is ready', async () => {
    const mgr = await freshManager()
    mgr.setDomReady()
    expect((globalThis as any).window.vscode.postMessage).not.toHaveBeenCalled()
  })

  it('does not send when only the event listener is ready', async () => {
    const mgr = await freshManager()
    mgr.setEventListenerReady()
    expect((globalThis as any).window.vscode.postMessage).not.toHaveBeenCalled()
  })

  it('sends exactly once when both are ready (DOM first)', async () => {
    const mgr = await freshManager()
    mgr.setDomReady()
    mgr.setEventListenerReady()
    expect((globalThis as any).window.vscode.postMessage).toHaveBeenCalledTimes(1)
    expect((globalThis as any).window.vscode.postMessage).toHaveBeenCalledWith({ type: 'ready' })
  })

  it('sends exactly once when both are ready (listener first)', async () => {
    const mgr = await freshManager()
    mgr.setEventListenerReady()
    mgr.setDomReady()
    expect((globalThis as any).window.vscode.postMessage).toHaveBeenCalledTimes(1)
  })

  it('is idempotent — re-asserting readiness does not re-send', async () => {
    const mgr = await freshManager()
    mgr.setDomReady()
    mgr.setEventListenerReady()
    mgr.setDomReady()
    mgr.setEventListenerReady()
    expect((globalThis as any).window.vscode.postMessage).toHaveBeenCalledTimes(1)
  })

  it('no-ops when window.vscode is not present (running outside the webview)', async () => {
    ;(globalThis as any).window = {}
    const mgr = await freshManager()
    expect(() => {
      mgr.setDomReady()
      mgr.setEventListenerReady()
    }).not.toThrow()
  })
})
