// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { isWebviewResourceUrl, loadableSource } from '../webviewResource'

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
