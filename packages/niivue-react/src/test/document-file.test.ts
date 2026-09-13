import { afterEach, describe, expect, it, vi } from 'vitest'
import { documentFile, isNvdFile, saveFile, setFileSaver } from '../document'

// jsdom's File has no arrayBuffer(); FileReader reads it.
function readBytes(file: File): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(Array.from(new Uint8Array(reader.result as ArrayBuffer)))
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}

const json = (value: unknown) => new TextEncoder().encode(JSON.stringify(value))

afterEach(() => {
  setFileSaver(null)
  delete (globalThis as any).vscode
  vi.unstubAllGlobals()
})

describe('isNvdFile', () => {
  it('recognizes documents by URL, ignoring a query or fragment', () => {
    expect(isNvdFile('https://example.org/scene.nvd?token=1')).toBe(true)
    expect(isNvdFile('https://example.org/scene.NVD.json#top')).toBe(true)
    expect(isNvdFile('https://example.org/brain.nii.gz?name=scene.nvd')).toBe(false)
    expect(isNvdFile('https://example.org/brain.nii.gz#scene.nvd')).toBe(false)
  })

  it('keeps # and ? in plain file names and workspace paths', () => {
    expect(isNvdFile('subject#1.nvd')).toBe(true)
    expect(isNvdFile('study#1/scene.nvd.json')).toBe(true)
    expect(isNvdFile('what?.nvd')).toBe(true)
  })
})

describe('documentFile', () => {
  it('passes CBOR bytes through, named after the file', async () => {
    const cbor = new Uint8Array([0xa1, 0x61, 0x61, 0x01])

    const file = await documentFile({ name: 'C:\\scans\\scene.nvd', data: cbor })

    expect(file.name).toBe('scene.nvd')
    expect(await readBytes(file)).toEqual([0xa1, 0x61, 0x61, 0x01])
  })

  it('completes a sparse JSON document', async () => {
    const file = await documentFile({ name: 'scene.nvd.json', data: json({ volumes: [] }) })

    const doc = JSON.parse(new TextDecoder().decode(new Uint8Array(await readBytes(file))))
    expect(doc.layout).toEqual({})
  })

  it('fetches a document that only has a URL', async () => {
    const fetch = vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () => json({ volumes: [] }).buffer,
    }))
    vi.stubGlobal('fetch', fetch)

    const file = await documentFile({
      name: 'https://h/a/scene.nvd.json?v=2',
      url: 'https://h/a/scene.nvd.json?v=2',
    })

    expect(fetch).toHaveBeenCalledWith('https://h/a/scene.nvd.json?v=2')
    expect(file.name).toBe('scene.nvd.json')
  })

  it('resolves relative links in a fetched JSON document against its final URL', async () => {
    const body = json({ volumes: [{ url: 'brain.nii.gz' }] })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        url: 'https://data.example/study/scene.nvd.json',
        arrayBuffer: async () => body.buffer,
      })),
    )

    const file = await documentFile({
      name: 'scene.nvd.json',
      url: 'https://data.example/redirect?id=7',
    })

    const doc = JSON.parse(new TextDecoder().decode(new Uint8Array(await readBytes(file))))
    expect(doc.volumes[0].url).toBe('https://data.example/study/brain.nii.gz')
  })

  it('resolves relative links in document bytes against their source URL', async () => {
    const file = await documentFile({
      name: 'scene.nvd.json',
      data: json({ volumes: [{ url: 'brain.nii.gz' }] }),
      url: 'https://data.example/study/scene.nvd.json',
    })

    const doc = JSON.parse(new TextDecoder().decode(new Uint8Array(await readBytes(file))))
    expect(doc.volumes[0].url).toBe('https://data.example/study/brain.nii.gz')
  })

  it('names the file after a # in a plain file name', async () => {
    const file = await documentFile({ name: 'subject#1.nvd', data: new Uint8Array([0xa0]) })

    expect(file.name).toBe('subject#1.nvd')
  })

  it('fails with the HTTP status when the URL cannot be fetched', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 404 })),
    )

    await expect(documentFile({ name: 'scene.nvd', url: 'https://h/scene.nvd' })).rejects.toThrow(
      'Could not fetch scene.nvd: HTTP 404',
    )
  })
})

describe('setFileSaver', () => {
  it('saves through the registered saver instead of the webview host', async () => {
    const postMessage = vi.fn()
    ;(globalThis as any).vscode = { postMessage }
    const saver = vi.fn()
    setFileSaver(saver)
    const bytes = Uint8Array.from([1, 2, 3])

    await saveFile(bytes, 'scene.nvd', 'application/octet-stream')

    expect(saver).toHaveBeenCalledWith(bytes, 'scene.nvd', 'application/octet-stream')
    expect(postMessage).not.toHaveBeenCalled()
  })

  it("passes on the saver's failure", async () => {
    setFileSaver(async () => {
      throw new Error('disk full')
    })

    await expect(
      saveFile(Uint8Array.from([1]), 'scene.nvd', 'application/octet-stream'),
    ).rejects.toThrow('disk full')
  })
})
