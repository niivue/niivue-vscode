/**
 * Minimal in-process stand-in for the `vscode` extension API.  Wired up via a
 * Vite alias in `vitest.config.ts` so that `import * as vscode from 'vscode'`
 * inside the source code resolves to this file during tests.
 *
 * Only the symbols actually exercised by the units under test are provided —
 * extend as needed.
 */
import { vi } from 'vitest'

/**
 * Real vscode.Uri serializes with `://` for hierarchical schemes (file, http,
 * https, vscode-remote, ...) and with `:` for opaque schemes (command,
 * mailto, data, ...). We track the form on the instance so `parse('file:///x')`
 * round-trips back to `file:///x` even though its authority is empty.
 */
const HIERARCHICAL_SCHEMES = new Set([
  'file',
  'http',
  'https',
  'ftp',
  'vscode-remote',
  'vscode-webview',
  'vscode-userdata',
])

export class Uri {
  constructor(
    public scheme: string,
    public authority: string,
    public path: string,
    public query: string = '',
    private readonly _hierarchical: boolean = HIERARCHICAL_SCHEMES.has(scheme) || authority !== '',
  ) {}

  static parse(value: string): Uri {
    // Authority-style URIs: <scheme>://<authority><path>?<query>
    const authorityMatch = value.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):\/\/([^/?#]*)([^?#]*)(?:\?([^#]*))?/)
    if (authorityMatch) {
      return new Uri(
        authorityMatch[1],
        authorityMatch[2] ?? '',
        authorityMatch[3] || '/',
        authorityMatch[4] ?? '',
        true, // explicit authority form
      )
    }
    // Opaque-scheme URIs (no //): <scheme>:<path>?<query>.
    // Real vscode's `command:foo?args` parses this way: scheme=command,
    // authority='', path='foo', query='args'.
    const opaqueMatch = value.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):([^?#]*)(?:\?([^#]*))?/)
    if (opaqueMatch) {
      return new Uri(opaqueMatch[1], '', opaqueMatch[2] ?? '', opaqueMatch[3] ?? '', false)
    }
    return new Uri('file', '', value, '', true)
  }

  static file(p: string): Uri {
    return new Uri('file', '', p, '', true)
  }

  static joinPath(base: Uri, ...parts: string[]): Uri {
    const tail = parts.join('/').replace(/^\/+/, '')
    const joined = `${base.path.replace(/\/+$/, '')}/${tail}`.replace(/\/{2,}/g, '/')
    return new Uri(base.scheme, base.authority, joined || '/', base.query, base._hierarchical)
  }

  toString(): string {
    const tail = this.query ? `?${this.query}` : ''
    if (this._hierarchical) {
      return `${this.scheme}://${this.authority}${this.path}${tail}`
    }
    return `${this.scheme}:${this.path}${tail}`
  }

  with(props: { scheme?: string; authority?: string; path?: string; query?: string }): Uri {
    return new Uri(
      props.scheme ?? this.scheme,
      props.authority ?? this.authority,
      props.path ?? this.path,
      props.query ?? this.query,
      this._hierarchical,
    )
  }
}

export const workspace = {
  workspaceFolders: undefined as undefined | { uri: Uri }[],
  fs: {
    readFile: vi.fn<(uri: Uri) => Promise<Uint8Array>>(),
    readDirectory: vi.fn(),
  },
  getConfiguration: vi.fn(),
}

export const window = {
  registerCustomEditorProvider: vi.fn(),
  createWebviewPanel: vi.fn(),
  showOpenDialog: vi.fn(),
}

export const ViewColumn = { One: 1 }

/**
 * Disposable: matches vscode.Disposable shape — just a `dispose()` method.
 * dispose.ts uses an array of these to register/release resources.
 */
export interface Disposable {
  dispose(): unknown
}

/**
 * EventEmitter stub: matches vscode.EventEmitter<T>'s API surface used in src.
 * Tracks listeners; `event` returns a subscribe function; `fire()` invokes them.
 */
export class EventEmitter<T> {
  private listeners = new Set<(e: T) => unknown>()

  event = (listener: (e: T) => unknown): Disposable => {
    this.listeners.add(listener)
    return { dispose: () => this.listeners.delete(listener) }
  }

  fire(data: T): void {
    for (const l of this.listeners) l(data)
  }

  dispose(): void {
    this.listeners.clear()
  }
}

/** Position: minimal stand-in for vscode.Position used by HoverProvider tests. */
export class Position {
  constructor(public line: number, public character: number) {}
}

/** Range: minimal stand-in for vscode.Range. */
export class Range {
  constructor(public start: Position, public end: Position) {}
}

/**
 * MarkdownString: vscode.MarkdownString — wraps content; `isTrusted` enables
 * command links. We only assert on `.value` and `.isTrusted` in tests.
 */
export class MarkdownString {
  isTrusted = false
  constructor(public value: string) {}
}

/** Hover: vscode.Hover — wraps a MarkdownString contents array. */
export class Hover {
  contents: (MarkdownString | string)[]
  constructor(contents: MarkdownString | string | (MarkdownString | string)[]) {
    this.contents = Array.isArray(contents) ? contents : [contents]
  }
}

/** Reset all mutable state between tests. */
export function __resetMock() {
  workspace.workspaceFolders = undefined
  workspace.fs.readFile.mockReset()
  workspace.fs.readDirectory.mockReset()
  workspace.getConfiguration.mockReset()
  window.registerCustomEditorProvider.mockReset()
  window.createWebviewPanel.mockReset()
  window.showOpenDialog.mockReset()
}
