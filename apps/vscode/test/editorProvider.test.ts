import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NiiVueEditorProvider } from '../src/editorProvider'
import { __resetMock, FileType, Uri, window, workspace } from './vscode-mock'

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

  it('sends a scene document in the workspace as a URL without reading it', async () => {
    workspace.workspaceFolders = [{ uri: Uri.parse('file:///home/user/proj') }]
    const webview = makeWebview()

    const body = await NiiVueEditorProvider.uriToImageBody(
      Uri.parse('file:///home/user/proj/scene.nvd'),
      webview as any,
    )

    expect(body).toEqual({ uri: 'https://cdn.vscode-cdn.net/home/user/proj/scene.nvd?scheme=file' })
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

describe('NiiVueEditorProvider.openDocument', () => {
  function makePanel() {
    return { webview: { ...makeWebview(), postMessage: vi.fn() } }
  }

  it('offers scene documents and sends the picked one like an image', async () => {
    workspace.workspaceFolders = [{ uri: Uri.parse('file:///home/user/proj') }]
    window.showOpenDialog.mockResolvedValue([Uri.parse('file:///home/user/proj/scene.nvd')])
    const panel = makePanel()

    await NiiVueEditorProvider.openDocument(panel as any)

    expect(window.showOpenDialog.mock.calls[0][0]).toMatchObject({
      canSelectMany: false,
      filters: { 'NiiVue Documents': ['nvd', 'json'], 'All Files': ['*'] },
    })
    expect(panel.webview.postMessage.mock.calls.map((call) => call[0])).toEqual([
      { type: 'initCanvas', body: { n: 1 } },
      {
        type: 'addImage',
        body: { uri: 'https://cdn.vscode-cdn.net/home/user/proj/scene.nvd?scheme=file' },
      },
    ])
  })

  it('does nothing when the dialog is cancelled', async () => {
    window.showOpenDialog.mockResolvedValue(undefined)
    const panel = makePanel()

    await NiiVueEditorProvider.openDocument(panel as any)

    expect(panel.webview.postMessage).not.toHaveBeenCalled()
  })

  it('reports a document it cannot read', async () => {
    window.showOpenDialog.mockResolvedValue([
      Uri.parse('vscode-remote://ssh-remote%2Bmyhost/data/scene.nvd'),
    ])
    workspace.fs.readFile.mockRejectedValue(new Error('ENOENT'))
    const panel = makePanel()

    await NiiVueEditorProvider.openDocument(panel as any)

    expect(panel.webview.postMessage).not.toHaveBeenCalled()
    expect(window.showErrorMessage).toHaveBeenCalledWith('Could not open scene.nvd: ENOENT')
  })
})

describe('NiiVueEditorProvider.saveFile', () => {
  // What the webview's Screenshot button sends: PNG bytes as base64.
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 255])
  const body = {
    filename: 'brain_screenshot.png',
    mimeType: 'image/png',
    data: Buffer.from(png).toString('base64'),
  }

  function dialogOptions() {
    const options = window.showSaveDialog.mock.calls[0][0] as any
    return { defaultUri: options.defaultUri?.toString(), filters: options.filters }
  }

  it("suggests the opened file's folder and writes the decoded bytes where the user chose", async () => {
    workspace.fs.isWritableFileSystem.mockReturnValue(true)
    const target = Uri.parse('file:///home/user/figures/fig1.png')
    window.showSaveDialog.mockResolvedValue(target)
    workspace.fs.writeFile.mockResolvedValue()

    await NiiVueEditorProvider.saveFile(body, Uri.parse('file:///home/user/scans/brain.nii.gz'))

    expect(dialogOptions()).toEqual({
      defaultUri: 'file:///home/user/scans/brain_screenshot.png',
      filters: { 'PNG Image': ['png'] },
    })
    expect(workspace.fs.writeFile).toHaveBeenCalledTimes(1)
    const [uri, bytes] = workspace.fs.writeFile.mock.calls[0]
    expect(uri).toBe(target)
    expect(Array.from(bytes)).toEqual(Array.from(png))
    expect(window.showInformationMessage).toHaveBeenCalledWith('Saved /home/user/figures/fig1.png')
    expect(window.showErrorMessage).not.toHaveBeenCalled()
  })

  it('shows the path relative to the workspace, and the paper to cite for a figure', async () => {
    workspace.fs.isWritableFileSystem.mockReturnValue(true)
    workspace.workspaceFolders = [{ uri: Uri.parse('file:///home/user/proj') }]
    window.showSaveDialog.mockResolvedValue(Uri.parse('file:///home/user/proj/figures/fig1.png'))
    workspace.fs.writeFile.mockResolvedValue()
    const source = Uri.parse('file:///home/user/proj/brain.nii.gz')

    await NiiVueEditorProvider.saveFile({ ...body, cite: true }, source)
    await NiiVueEditorProvider.saveFile({ ...body, filename: 'brain.nvd', cite: false }, source)

    expect(window.showInformationMessage.mock.calls.map((call) => call[0])).toEqual([
      'Saved figures/fig1.png. If you publish this figure, please cite [Eckstein et al., Aperture Neuro 2026](https://doi.org/10.52294/001c.167815).',
      'Saved figures/fig1.png',
    ])
  })

  it('keeps the scheme and authority of a remote file', async () => {
    workspace.fs.isWritableFileSystem.mockReturnValue(true)
    window.showSaveDialog.mockResolvedValue(undefined)

    await NiiVueEditorProvider.saveFile(
      body,
      Uri.parse('vscode-remote://ssh-remote%2Bmyhost/data/sub-01/brain.nii.gz'),
    )

    expect(workspace.fs.isWritableFileSystem).toHaveBeenCalledWith('vscode-remote')
    expect(dialogOptions().defaultUri).toBe(
      'vscode-remote://ssh-remote%2Bmyhost/data/sub-01/brain_screenshot.png',
    )
  })

  it('suggests the workspace folder when the opened file is a web link', async () => {
    workspace.fs.isWritableFileSystem.mockReturnValue(undefined)
    workspace.workspaceFolders = [{ uri: Uri.parse('file:///home/user/proj') }]
    window.showSaveDialog.mockResolvedValue(undefined)

    await NiiVueEditorProvider.saveFile(body, Uri.parse('https://example.com/data/brain.nii.gz'))

    expect(dialogOptions().defaultUri).toBe('file:///home/user/proj/brain_screenshot.png')
  })

  it('leaves the location to the dialog without a writable folder or workspace', async () => {
    workspace.fs.isWritableFileSystem.mockReturnValue(undefined)
    window.showSaveDialog.mockResolvedValue(undefined)

    await NiiVueEditorProvider.saveFile(body, Uri.parse('https://example.com/data/brain.nii.gz'))

    expect(dialogOptions().defaultUri).toBeUndefined()
  })

  it('does nothing when the dialog is cancelled', async () => {
    workspace.fs.isWritableFileSystem.mockReturnValue(true)
    window.showSaveDialog.mockResolvedValue(undefined)

    await NiiVueEditorProvider.saveFile(body, Uri.parse('file:///scans/brain.nii.gz'))

    expect(workspace.fs.writeFile).not.toHaveBeenCalled()
    expect(window.showInformationMessage).not.toHaveBeenCalled()
    expect(window.showErrorMessage).not.toHaveBeenCalled()
  })

  it('reports a failed write', async () => {
    workspace.fs.isWritableFileSystem.mockReturnValue(true)
    window.showSaveDialog.mockResolvedValue(Uri.parse('file:///readonly/fig.png'))
    workspace.fs.writeFile.mockRejectedValue(new Error('EACCES: permission denied'))

    await NiiVueEditorProvider.saveFile(body, Uri.parse('file:///scans/brain.nii.gz'))

    expect(window.showErrorMessage).toHaveBeenCalledWith(
      'Could not save fig.png: EACCES: permission denied',
    )
    expect(window.showInformationMessage).not.toHaveBeenCalled()
  })

  it('reports a failing save dialog and ignores a non-string MIME type', async () => {
    workspace.fs.isWritableFileSystem.mockReturnValue(true)
    window.showSaveDialog.mockRejectedValue(new Error('dialog unavailable'))

    await NiiVueEditorProvider.saveFile(
      { ...body, filename: 'fig.png', mimeType: { toString: 0, valueOf: 0 } },
      Uri.parse('file:///scans/brain.nii.gz'),
    )

    expect(dialogOptions().filters).toBeUndefined()
    expect(window.showErrorMessage).toHaveBeenCalledWith('Could not save fig.png: dialog unavailable')
    expect(workspace.fs.writeFile).not.toHaveBeenCalled()
  })

  it('reduces a suggested name to its last path segment', async () => {
    workspace.fs.isWritableFileSystem.mockReturnValue(true)
    window.showSaveDialog.mockResolvedValue(undefined)

    await NiiVueEditorProvider.saveFile(
      { ...body, filename: '..\\..\\other/escape.png' },
      Uri.parse('file:///scans/brain.nii.gz'),
    )

    expect(dialogOptions().defaultUri).toBe('file:///scans/escape.png')
  })

  it('offers no filter for types it does not know', async () => {
    workspace.fs.isWritableFileSystem.mockReturnValue(true)
    window.showSaveDialog.mockResolvedValue(undefined)

    await NiiVueEditorProvider.saveFile(
      { ...body, filename: 'data.bin', mimeType: 'application/octet-stream' },
      Uri.parse('file:///scans/brain.nii.gz'),
    )

    expect(dialogOptions()).toEqual({ defaultUri: 'file:///scans/data.bin', filters: undefined })
  })

  it('offers a filter for scene documents, binary and JSON', async () => {
    workspace.fs.isWritableFileSystem.mockReturnValue(true)
    window.showSaveDialog.mockResolvedValue(undefined)
    const source = Uri.parse('file:///scans/brain.nii.gz')

    await NiiVueEditorProvider.saveFile(
      { ...body, filename: 'brain.nvd', mimeType: 'application/octet-stream' },
      source,
    )
    await NiiVueEditorProvider.saveFile(
      { ...body, filename: 'brain.nvd.json', mimeType: 'application/json' },
      source,
    )

    const filters = window.showSaveDialog.mock.calls.map((call) => (call[0] as any).filters)
    expect(filters).toEqual([{ 'NiiVue Document': ['nvd'] }, { 'JSON Document': ['json'] }])
  })

  it('ignores a message without data', async () => {
    await NiiVueEditorProvider.saveFile({ filename: 'x.png' }, Uri.parse('file:///scans/a.nii'))
    await NiiVueEditorProvider.saveFile(undefined, Uri.parse('file:///scans/a.nii'))

    expect(window.showSaveDialog).not.toHaveBeenCalled()
  })

  it('handles saveFile and openDocument messages from the webview of an opened document', async () => {
    const listeners: ((message: unknown) => unknown)[] = []
    const panel = {
      webview: {
        options: {},
        html: '',
        cspSource: 'vscode-resource:',
        asWebviewUri: (uri: Uri) => ({ toString: () => `https://cdn.vscode-cdn.net${uri.path}` }),
        postMessage: vi.fn(),
        onDidReceiveMessage: (listener: (message: unknown) => unknown) => {
          listeners.push(listener)
          return { dispose: () => {} }
        },
      },
      onDidDispose: () => ({ dispose: () => {} }),
    }
    const provider = new NiiVueEditorProvider({ extensionUri: Uri.file('/ext') } as any)
    await provider.resolveCustomEditor(
      { uri: Uri.parse('file:///study/sub-01/brain.nii.gz') } as any,
      panel as any,
    )
    workspace.fs.isWritableFileSystem.mockReturnValue(true)
    window.showSaveDialog.mockResolvedValue(undefined)

    await Promise.all(listeners.map((listener) => listener({ type: 'saveFile', body })))

    expect(window.showSaveDialog).toHaveBeenCalledTimes(1)
    expect(dialogOptions().defaultUri).toBe('file:///study/sub-01/brain_screenshot.png')

    window.showOpenDialog.mockResolvedValue(undefined)
    await Promise.all(listeners.map((listener) => listener({ type: 'openDocument' })))

    expect(window.showOpenDialog).toHaveBeenCalledTimes(1)
  })
})
