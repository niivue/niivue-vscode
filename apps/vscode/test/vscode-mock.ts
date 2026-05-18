/**
 * Minimal in-process stand-in for the `vscode` extension API.  Wired up via a
 * Vite alias in `vitest.config.ts` so that `import * as vscode from 'vscode'`
 * inside the source code resolves to this file during tests.
 *
 * Only the symbols actually exercised by the units under test are provided —
 * extend as needed.
 */
import { vi } from 'vitest'

export class Uri {
  constructor(public scheme: string, public authority: string, public path: string) {}

  static parse(value: string): Uri {
    const match = value.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):\/\/([^/?#]*)(\/[^?#]*)?/)
    if (match) {
      return new Uri(match[1], match[2] ?? '', match[3] ?? '/')
    }
    return new Uri('file', '', value)
  }

  static file(p: string): Uri {
    return new Uri('file', '', p)
  }

  static joinPath(base: Uri, ...parts: string[]): Uri {
    const tail = parts.join('/').replace(/^\/+/, '')
    const joined = `${base.path.replace(/\/+$/, '')}/${tail}`.replace(/\/{2,}/g, '/')
    return new Uri(base.scheme, base.authority, joined || '/')
  }

  toString(): string {
    return `${this.scheme}://${this.authority}${this.path}`
  }

  with(props: { scheme?: string; authority?: string; path?: string }): Uri {
    return new Uri(
      props.scheme ?? this.scheme,
      props.authority ?? this.authority,
      props.path ?? this.path,
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
