// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { isWebviewResourceUrl, loadableSource, mhaWithTransform } from '../webviewResource'

const webviewUrl =
  'https://file+.vscode-resource.vscode-cdn.net/d%3A/study/sub%2001/brain.nii.gz'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('isWebviewResourceUrl', () => {
  it('matches local and remote VS Code webview resource URLs', () => {
    expect(isWebviewResourceUrl(webviewUrl)).toBe(true)
    expect(
      isWebviewResourceUrl(
        'https://vscode-remote+ssh-002dremote-002bhost.vscode-resource.vscode-cdn.net/home/a.nii',
      ),
    ).toBe(true)
  })

  it('leaves other URLs and file names alone', () => {
    expect(isWebviewResourceUrl('https://niivue.github.io/niivue-demo-images/mni152.nii.gz')).toBe(
      false,
    )
    expect(isWebviewResourceUrl('https://evil.example/x.vscode-resource.vscode-cdn.net.nii')).toBe(
      false,
    )
    expect(isWebviewResourceUrl('brain.nii.gz')).toBe(false)
  })
})

describe('loadableSource', () => {
  it('returns other URLs unchanged, without fetching', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const url = 'https://niivue.github.io/niivue-demo-images/mni152.nii.gz'
    expect(await loadableSource(url)).toBe(url)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fetches a webview resource URL into a File named like the file', async () => {
    const fetchMock = vi.fn(async () => new Response(new Uint8Array([1, 2, 3])))
    vi.stubGlobal('fetch', fetchMock)

    const source = await loadableSource(webviewUrl)

    expect(fetchMock).toHaveBeenCalledWith(webviewUrl)
    expect(source).toBeInstanceOf(File)
    expect((source as File).name).toBe('brain.nii.gz')
    expect(new Uint8Array(await (source as File).arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]))
  })

  it('reports a failed fetch with its status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 404, statusText: 'Not Found' })),
    )
    await expect(loadableSource(webviewUrl)).rejects.toThrow(`Failed to load ${webviewUrl}: 404 Not Found`)
  })
})

describe('mhaWithTransform', () => {
  const header = 'ObjectType = Image\nNDims = 3\nDimSize = 2 1 1\nElementType = MET_UCHAR\nElementDataFile = LOCAL\n'

  it('adds the missing TransformMatrix and keeps the voxel data after the header', async () => {
    const source = new File([header, new Uint8Array([7, 9])], 'mask.mha')

    const file = await mhaWithTransform(source)

    const bytes = new Uint8Array(await file.arrayBuffer())
    expect(file.name).toBe('mask.mha')
    expect(new TextDecoder('latin1').decode(bytes)).toContain('TransformMatrix = 1 0 0 0 1 0 0 0 1\nElementDataFile')
    expect(Array.from(bytes.slice(-2))).toEqual([7, 9])
  })

  it('passes a header that has a TransformMatrix through unchanged', async () => {
    const text = header.replace('ElementDataFile', 'TransformMatrix = -1 0 0 0 1 0 0 0 1\nElementDataFile')
    const source = new File([text], 'scan.mha')

    const file = await mhaWithTransform(source)

    expect(await file.text()).toBe(text)
  })

  it('fetches a URL first', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(header)))
    const file = await mhaWithTransform('https://example.org/data/scan.mhd')
    expect(file.name).toBe('scan.mhd')
    expect(await file.text()).toContain('TransformMatrix = 1 0 0 0 1 0 0 0 1')
  })
})
