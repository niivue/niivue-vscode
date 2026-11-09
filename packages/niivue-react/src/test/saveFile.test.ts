import { afterEach, describe, expect, it, vi } from 'vitest'
import { saveFile } from '../document'

afterEach(() => {
  delete (globalThis as any).vscode
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('saveFile', () => {
  it('base64-encodes files larger than one encoding chunk without loss', () => {
    const postMessage = vi.fn()
    ;(globalThis as any).vscode = { postMessage }
    const bytes = Uint8Array.from({ length: 100_003 }, (_, i) => (i * 31 + 17) % 256)

    saveFile(bytes, 'figure.png', 'image/png')

    const { body } = postMessage.mock.calls[0][0]
    expect(Buffer.from(body.data, 'base64')).toEqual(Buffer.from(bytes))
  })

  it('downloads through a temporary link on standalone hosts', () => {
    vi.useFakeTimers()
    const clicked: string[] = []
    URL.createObjectURL = vi.fn(() => 'blob:figure')
    URL.revokeObjectURL = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push(this.download)
    })

    saveFile(Uint8Array.from([1, 2, 3]), 'figure.png', 'image/png')

    expect(clicked).toEqual(['figure.png'])
    expect(document.querySelector('a')).toBeNull()
    vi.runAllTimers()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:figure')
  })
})
