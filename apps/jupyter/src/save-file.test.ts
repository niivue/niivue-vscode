import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadFile, isSaveFileBody } from './save-file'

// The node test environment has no DOM; a minimal document records the link.
function fakeDocument() {
  const link = { href: '', download: '', click: vi.fn(), remove: vi.fn() }
  const doc = {
    createElement: vi.fn(() => link),
    body: { appendChild: vi.fn() },
  }
  return { doc: doc as unknown as Document, link }
}

let blobs: Blob[]

beforeEach(() => {
  blobs = []
  vi.useFakeTimers()
  vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
    blobs.push(blob as Blob)
    return 'blob:saved-file'
  })
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('downloadFile', () => {
  const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 128, 255])
  const body = {
    filename: 'brain_screenshot.png',
    mimeType: 'image/png',
    data: Buffer.from(png).toString('base64'),
  }

  it('downloads the decoded bytes under the suggested name', async () => {
    const { doc, link } = fakeDocument()

    expect(downloadFile(body, doc)).toBe(true)

    expect(link.download).toBe('brain_screenshot.png')
    expect(link.href).toBe('blob:saved-file')
    expect(link.click).toHaveBeenCalledTimes(1)
    expect(link.remove).toHaveBeenCalledTimes(1)
    expect(blobs[0].type).toBe('image/png')
    expect(new Uint8Array(await blobs[0].arrayBuffer())).toEqual(png)
  })

  it('revokes the object URL once the click is dispatched', () => {
    const { doc } = fakeDocument()

    downloadFile(body, doc)
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
    vi.runAllTimers()

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:saved-file')
  })

  it('ignores malformed messages', () => {
    const { doc } = fakeDocument()

    expect(downloadFile(undefined, doc)).toBe(false)
    expect(downloadFile({ ...body, data: undefined }, doc)).toBe(false)
    expect(downloadFile({ ...body, filename: 42 }, doc)).toBe(false)
    expect(downloadFile({ ...body, data: '!' }, doc)).toBe(false)

    expect(doc.createElement).not.toHaveBeenCalled()
  })
})

describe('isSaveFileBody', () => {
  it('requires a file name, MIME type and base64 data', () => {
    expect(isSaveFileBody({ filename: 'a.png', mimeType: 'image/png', data: '' })).toBe(true)
    expect(isSaveFileBody({ filename: 'a.png', mimeType: 'image/png' })).toBe(false)
    expect(isSaveFileBody(null)).toBe(false)
    expect(isSaveFileBody('saveFile')).toBe(false)
  })
})
