import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NiiVueEditorProvider } from '../src/editorProvider'
import { __resetMock, FileType, Uri, workspace } from './vscode-mock'

/** 140-byte buffer with the DICOM Part 10 magic ("DICM" at offset 128). */
function dicomBytes(): Uint8Array {
  const bytes = new Uint8Array(140)
  bytes.set([0x44, 0x49, 0x43, 0x4d], 128)
  return bytes
}

/** 140-byte buffer without the DICOM magic. */
function nonDicomBytes(): Uint8Array {
  return new Uint8Array(140)
}

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

  it('ships binary for an extension-less file whose content is DICOM', async () => {
    // Scanner exports often have no extension (IM_0001) or a bare UID as the
    // name. The custom-editor selector can't match those, but "NiiVue: Open"
    // can still target them; the provider must sniff the DICOM magic
    // (128-byte preamble + "DICM") and ship bytes so the webview routes the
    // file through the DICOM loader.
    workspace.workspaceFolders = [{ uri: Uri.parse('file:///home/user/proj') }]
    const payload = new Uint8Array(140)
    payload.set([0x44, 0x49, 0x43, 0x4d], 128) // "DICM"
    workspace.fs.readFile.mockResolvedValueOnce(payload)
    const webview = makeWebview()
    const uri = Uri.parse('file:///home/user/proj/IM_0001')

    const body = await NiiVueEditorProvider.uriToImageBody(uri, webview as any)

    expect(body.data).toBeInstanceOf(ArrayBuffer)
    expect(body.uri).toBe('file:///home/user/proj/IM_0001')
    expect(webview.asWebviewUri).not.toHaveBeenCalled()
  })

  it('ships binary for a UID-named DICOM file (dots but no real extension)', async () => {
    workspace.workspaceFolders = [{ uri: Uri.parse('file:///home/user/proj') }]
    const payload = new Uint8Array(140)
    payload.set([0x44, 0x49, 0x43, 0x4d], 128)
    workspace.fs.readFile.mockResolvedValueOnce(payload)
    const uri = Uri.parse('file:///home/user/proj/1.2.840.113619.2.5.1762583153.101')

    const body = await NiiVueEditorProvider.uriToImageBody(uri, makeWebview() as any)

    expect(body.data).toBeInstanceOf(ArrayBuffer)
  })

  it('falls back to a webview URL for an extension-less file that is not DICOM', async () => {
    workspace.workspaceFolders = [{ uri: Uri.parse('file:///home/user/proj') }]
    workspace.fs.readFile.mockResolvedValueOnce(new Uint8Array(200)) // no magic
    const webview = makeWebview()
    const uri = Uri.parse('file:///home/user/proj/Makefile')

    const body = await NiiVueEditorProvider.uriToImageBody(uri, webview as any)

    expect(body.data).toBeUndefined()
    expect(body.uri).toContain('vscode-cdn.net')
    expect(webview.asWebviewUri).toHaveBeenCalledOnce()
  })

  it('does not sniff files with a recognized extension', async () => {
    workspace.workspaceFolders = [{ uri: Uri.parse('file:///home/user/proj') }]
    const webview = makeWebview()
    const uri = Uri.parse('file:///home/user/proj/mesh.gii')

    const body = await NiiVueEditorProvider.uriToImageBody(uri, webview as any)

    expect(body.data).toBeUndefined()
    expect(workspace.fs.readFile).not.toHaveBeenCalled()
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

describe('NiiVueEditorProvider.isDicomCandidateName', () => {
  it.each([
    ['scan.dcm', true],
    ['SCAN.DCM', true],
    ['image.ima', true],
    ['IM_0001', true], // extension-less scanner export
    ['1.2.840.113619.2.5.1762583153.101', true], // bare DICOM UID
    ['scan.nii', false],
    ['scan.nii.gz', false],
    ['readme.md', false],
    ['mesh.gii', false],
  ])('given %s, returns %s', (name, expected) => {
    expect(NiiVueEditorProvider.isDicomCandidateName(name)).toBe(expected)
  })
})

describe('NiiVueEditorProvider.collectDicomFolder', () => {
  // Mirror the way VS Code's fs returns per-URI bytes.
  function readFileByName(map: Record<string, Uint8Array>) {
    return async (uri: Uri) => {
      const name = uri.path.split('/').pop() ?? ''
      const bytes = map[name]
      if (!bytes) throw new Error(`ENOENT ${name}`)
      return bytes
    }
  }

  it('collects only files that sniff as DICOM, sorted by URI', async () => {
    workspace.fs.readDirectory.mockResolvedValue([
      ['slice2.dcm', FileType.File],
      ['slice1.dcm', FileType.File],
      ['notes.txt', FileType.File], // skipped: not a DICOM candidate name
      ['nested', FileType.Directory], // skipped: not a file
    ])
    workspace.fs.readFile.mockImplementation(
      readFileByName({ 'slice1.dcm': dicomBytes(), 'slice2.dcm': dicomBytes() }),
    )

    const result = await NiiVueEditorProvider.collectDicomFolder(
      Uri.parse('file:///proj/series'),
    )

    expect(result.uris).toEqual([
      'file:///proj/series/slice1.dcm',
      'file:///proj/series/slice2.dcm',
    ])
    expect(result.datas).toHaveLength(2)
    // notes.txt is name-filtered before any read
    expect(workspace.fs.readFile).not.toHaveBeenCalledWith(
      expect.objectContaining({ path: '/proj/series/notes.txt' }),
    )
  })

  it('drops extension-less candidates whose content is not DICOM', async () => {
    workspace.fs.readDirectory.mockResolvedValue([
      ['IM_0001', FileType.File],
      ['IM_0002', FileType.File],
      ['Makefile', FileType.File], // candidate by name, but not DICOM content
    ])
    workspace.fs.readFile.mockImplementation(
      readFileByName({
        IM_0001: dicomBytes(),
        IM_0002: dicomBytes(),
        Makefile: nonDicomBytes(),
      }),
    )

    const result = await NiiVueEditorProvider.collectDicomFolder(Uri.parse('file:///scan'))

    expect(result.uris).toEqual(['file:///scan/IM_0001', 'file:///scan/IM_0002'])
  })

  it('returns empty when the directory cannot be read', async () => {
    workspace.fs.readDirectory.mockRejectedValue(new Error('EACCES'))
    const result = await NiiVueEditorProvider.collectDicomFolder(Uri.parse('file:///x'))
    expect(result).toEqual({ uris: [], datas: [] })
  })
})

describe('NiiVueEditorProvider.collectDicomFolderImages', () => {
  it('expands a clicked DICOM file to every DICOM in its folder', async () => {
    workspace.fs.readDirectory.mockResolvedValue([
      ['001.dcm', FileType.File],
      ['002.dcm', FileType.File],
    ])
    workspace.fs.readFile.mockResolvedValue(dicomBytes())

    const series = await NiiVueEditorProvider.collectDicomFolderImages(
      Uri.parse('file:///study/001.dcm'),
    )

    expect(series).not.toBeNull()
    expect(series!.uris).toEqual(['file:///study/001.dcm', 'file:///study/002.dcm'])
  })

  it('returns null when the clicked file is not DICOM (caller loads it singly)', async () => {
    workspace.fs.readFile.mockResolvedValueOnce(nonDicomBytes())
    const series = await NiiVueEditorProvider.collectDicomFolderImages(
      Uri.parse('file:///study/IM_0001'),
    )
    expect(series).toBeNull()
  })
})

describe('NiiVueEditorProvider.sendInitialImage', () => {
  function makeWebviewWithPost() {
    return {
      asWebviewUri: vi.fn((uri: Uri) => ({
        toString: () => `https://cdn.vscode-cdn.net${uri.path}?scheme=${uri.scheme}`,
      })),
      postMessage: vi.fn(),
    }
  }

  it('sends the whole DICOM series when a single DICOM file is opened', async () => {
    workspace.fs.readDirectory.mockResolvedValue([
      ['001.dcm', FileType.File],
      ['002.dcm', FileType.File],
      ['003.dcm', FileType.File],
    ])
    workspace.fs.readFile.mockResolvedValue(dicomBytes())
    const webview = makeWebviewWithPost()

    await NiiVueEditorProvider.sendInitialImage(Uri.parse('file:///study/001.dcm'), webview as any)

    expect(webview.postMessage).toHaveBeenCalledTimes(1)
    const message = webview.postMessage.mock.calls[0][0]
    expect(message.type).toBe('addImage')
    expect(Array.isArray(message.body.uri)).toBe(true)
    expect(message.body.uri).toHaveLength(3)
    expect(message.body.data).toHaveLength(3)
  })

  it('expands an extension-less DICOM file (right-click "NiiVue: Open")', async () => {
    workspace.fs.readDirectory.mockResolvedValue([
      ['IM_0001', FileType.File],
      ['IM_0002', FileType.File],
    ])
    workspace.fs.readFile.mockResolvedValue(dicomBytes())
    const webview = makeWebviewWithPost()

    await NiiVueEditorProvider.sendInitialImage(Uri.parse('file:///scan/IM_0001'), webview as any)

    const message = webview.postMessage.mock.calls[0][0]
    expect(message.body.uri).toEqual(['file:///scan/IM_0001', 'file:///scan/IM_0002'])
  })

  it('loads a single image (not a series) for non-DICOM files', async () => {
    workspace.workspaceFolders = [{ uri: Uri.parse('file:///proj') }]
    const webview = makeWebviewWithPost()

    await NiiVueEditorProvider.sendInitialImage(Uri.parse('file:///proj/brain.nii.gz'), webview as any)

    const message = webview.postMessage.mock.calls[0][0]
    expect(message.type).toBe('addImage')
    expect(message.body.uri).toBe('https://cdn.vscode-cdn.net/proj/brain.nii.gz?scheme=file')
    // .nii.gz is never read for DICOM sniffing
    expect(workspace.fs.readDirectory).not.toHaveBeenCalled()
    expect(workspace.fs.readFile).not.toHaveBeenCalled()
  })
})
