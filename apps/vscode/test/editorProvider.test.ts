import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NiiVueEditorProvider } from '../src/editorProvider'
import { __resetMock, Uri, workspace } from './vscode-mock'

/**
 * These tests pin down the URL-vs-binary decision made by
 * `NiiVueEditorProvider.uriToImageBody` and `isUriAccessible`.  The bug they
 * guard against — "Add Image / Add Overlay fails on VS Code Remote-SSH"
 * (commit 887c819 was lost in a merge once already) — manifests when the
 * resource proxy can't serve a file but the helper still hands the webview a
 * `webview.asWebviewUri(...)` URL.
 */

function makeWebview(): { asWebviewUri: ReturnType<typeof vi.fn> } {
  // Real `webview.asWebviewUri` returns a Uri whose `.toString()` is a fully
  // proxied https://*.vscode-cdn.net URL.  Source only calls `.toString()` on
  // the result, so a stub with just that method is sufficient.
  return {
    asWebviewUri: vi.fn((uri: Uri) => ({
      toString: () => `https://cdn.vscode-cdn.net${uri.path}?scheme=${uri.scheme}`,
    })),
  }
}

beforeEach(() => {
  __resetMock()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('NiiVueEditorProvider.isUriAccessible', () => {
  it('returns false when no workspace folder is open', () => {
    workspace.workspaceFolders = undefined
    const uri = Uri.parse('file:///home/user/data.nii.gz')
    expect(NiiVueEditorProvider.isUriAccessible(uri)).toBe(false)
  })

  it('returns true for a local file inside the workspace', () => {
    const workspaceUri = Uri.parse('file:///home/user/proj')
    workspace.workspaceFolders = [{ uri: workspaceUri }]
    const uri = Uri.parse('file:///home/user/proj/data.nii.gz')
    expect(NiiVueEditorProvider.isUriAccessible(uri)).toBe(true)
  })

  it('returns true for a remote file inside a matching remote workspace', () => {
    const workspaceUri = Uri.parse('vscode-remote://ssh-remote%2Bmyhost/home/user/proj')
    workspace.workspaceFolders = [{ uri: workspaceUri }]
    const uri = Uri.parse('vscode-remote://ssh-remote%2Bmyhost/home/user/proj/atlas.nii.gz')
    expect(NiiVueEditorProvider.isUriAccessible(uri)).toBe(true)
  })

  it('returns false when authorities differ (remote uri, local workspace)', () => {
    workspace.workspaceFolders = [{ uri: Uri.parse('file:///home/user/proj') }]
    const remoteUri = Uri.parse('vscode-remote://ssh-remote%2Bmyhost/home/user/proj/data.nii.gz')
    expect(NiiVueEditorProvider.isUriAccessible(remoteUri)).toBe(false)
  })

  it('returns false when schemes differ', () => {
    workspace.workspaceFolders = [{ uri: Uri.parse('vscode-remote://ssh-remote%2Bmyhost/home') }]
    const fileUri = Uri.parse('file:///home/data.nii.gz')
    expect(NiiVueEditorProvider.isUriAccessible(fileUri)).toBe(false)
  })

  it('returns false for a sibling directory outside the workspace folder', () => {
    workspace.workspaceFolders = [{ uri: Uri.parse('file:///home/user/proj') }]
    const outsideUri = Uri.parse('file:///home/user/other-proj/data.nii.gz')
    expect(NiiVueEditorProvider.isUriAccessible(outsideUri)).toBe(false)
  })
})

describe('NiiVueEditorProvider.uriToImageBody', () => {
  it('returns a webview URL for an accessible local file', async () => {
    workspace.workspaceFolders = [{ uri: Uri.parse('file:///home/user/proj') }]
    const webview = makeWebview()
    const uri = Uri.parse('file:///home/user/proj/data.nii.gz')

    const body = await NiiVueEditorProvider.uriToImageBody(uri, webview as any)

    expect(body.data).toBeUndefined()
    expect(body.uri).toBe('https://cdn.vscode-cdn.net/home/user/proj/data.nii.gz?scheme=file')
    expect(webview.asWebviewUri).toHaveBeenCalledOnce()
    expect(workspace.fs.readFile).not.toHaveBeenCalled()
  })

  it('returns a webview URL for an accessible remote file', async () => {
    workspace.workspaceFolders = [
      { uri: Uri.parse('vscode-remote://ssh-remote%2Bmyhost/home/user/proj') },
    ]
    const webview = makeWebview()
    const uri = Uri.parse('vscode-remote://ssh-remote%2Bmyhost/home/user/proj/atlas.nii.gz')

    const body = await NiiVueEditorProvider.uriToImageBody(uri, webview as any)

    expect(body.data).toBeUndefined()
    expect(body.uri).toContain('vscode-cdn.net')
    expect(webview.asWebviewUri).toHaveBeenCalledOnce()
    expect(workspace.fs.readFile).not.toHaveBeenCalled()
  })

  it('falls back to binary when the remote file is outside any workspace folder', async () => {
    // The historical bug: open-dialog can return any path the user picks; on
    // remote that path isn't covered by `localResourceRoots`, so the URL path
    // would silently 401.  The helper must spot this and ship bytes instead.
    workspace.workspaceFolders = [
      { uri: Uri.parse('vscode-remote://ssh-remote%2Bmyhost/home/user/proj') },
    ]
    const payload = new Uint8Array([1, 2, 3, 4])
    workspace.fs.readFile.mockResolvedValueOnce(payload)
    const webview = makeWebview()
    const uri = Uri.parse('vscode-remote://ssh-remote%2Bmyhost/data/atlas.nii.gz')

    const body = await NiiVueEditorProvider.uriToImageBody(uri, webview as any)

    expect(body.data).toBeInstanceOf(ArrayBuffer)
    expect(new Uint8Array(body.data!)).toEqual(payload)
    expect(body.uri).toBe('vscode-remote://ssh-remote%2Bmyhost/data/atlas.nii.gz')
    expect(webview.asWebviewUri).not.toHaveBeenCalled()
    expect(workspace.fs.readFile).toHaveBeenCalledWith(uri)
  })

  it('falls back to binary when no workspace folder is open (single-file mode)', async () => {
    workspace.workspaceFolders = undefined
    workspace.fs.readFile.mockResolvedValueOnce(new Uint8Array([9, 9, 9]))
    const webview = makeWebview()
    const uri = Uri.parse('vscode-remote://ssh-remote%2Bmyhost/home/user/data.nii.gz')

    const body = await NiiVueEditorProvider.uriToImageBody(uri, webview as any)

    expect(body.data).toBeInstanceOf(ArrayBuffer)
    expect(webview.asWebviewUri).not.toHaveBeenCalled()
  })

  it('forces binary for .dcm even when the file is in the workspace', async () => {
    workspace.workspaceFolders = [{ uri: Uri.parse('file:///home/user/proj') }]
    workspace.fs.readFile.mockResolvedValueOnce(new Uint8Array([0x44, 0x49, 0x43, 0x4d]))
    const webview = makeWebview()
    const uri = Uri.parse('file:///home/user/proj/scan.dcm')

    const body = await NiiVueEditorProvider.uriToImageBody(uri, webview as any)

    expect(body.data).toBeInstanceOf(ArrayBuffer)
    expect(body.uri).toBe('file:///home/user/proj/scan.dcm')
    expect(webview.asWebviewUri).not.toHaveBeenCalled()
    expect(workspace.fs.readFile).toHaveBeenCalledWith(uri)
  })

  it('forces binary for .mnc even when the file is in the workspace', async () => {
    workspace.workspaceFolders = [{ uri: Uri.parse('file:///home/user/proj') }]
    workspace.fs.readFile.mockResolvedValueOnce(new Uint8Array([0]))
    const webview = makeWebview()
    const uri = Uri.parse('file:///home/user/proj/scan.mnc')

    const body = await NiiVueEditorProvider.uriToImageBody(uri, webview as any)

    expect(body.data).toBeInstanceOf(ArrayBuffer)
    expect(webview.asWebviewUri).not.toHaveBeenCalled()
  })

  it('produces a fresh ArrayBuffer (not a view onto a pooled Node Buffer)', async () => {
    // VS Code returns Uint8Array views that on Node are backed by a shared
    // ArrayBuffer pool — handing that to postMessage would leak unrelated
    // memory.  toArrayBuffer must copy.
    workspace.workspaceFolders = [{ uri: Uri.parse('file:///home/user/proj') }]
    const shared = new ArrayBuffer(16)
    const view = new Uint8Array(shared, 4, 4)
    view.set([1, 2, 3, 4])
    workspace.fs.readFile.mockResolvedValueOnce(view)
    const uri = Uri.parse('file:///home/user/proj/scan.dcm')

    const body = await NiiVueEditorProvider.uriToImageBody(uri, makeWebview() as any)

    expect(body.data!.byteLength).toBe(4)
    expect(body.data).not.toBe(shared)
    expect(new Uint8Array(body.data!)).toEqual(new Uint8Array([1, 2, 3, 4]))
  })
})
