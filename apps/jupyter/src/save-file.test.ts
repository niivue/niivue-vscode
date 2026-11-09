import { describe, expect, it, vi } from 'vitest'
import {
  isNotFound,
  isSaveFileBody,
  savedMessage,
  saveToWorkspace,
  suggestedSavePath,
  WorkspaceSaver,
} from './save-file'

function fakeSaver(overrides: Partial<WorkspaceSaver> = {}) {
  return {
    askPath: vi.fn(async (suggested: string) => suggested),
    exists: vi.fn(async () => false),
    confirmReplace: vi.fn(async () => true),
    write: vi.fn(async () => {}),
    saved: vi.fn(),
    failed: vi.fn(),
    ...overrides,
  }
}

describe('saveToWorkspace', () => {
  const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 128, 255])
  const body = {
    filename: 'brain_screenshot.png',
    mimeType: 'image/png',
    data: Buffer.from(png).toString('base64'),
  }

  it("writes the file next to the opened file under the viewer's name", async () => {
    const saver = fakeSaver()

    expect(await saveToWorkspace(body, 'study/sub-01', saver)).toBe(
      'study/sub-01/brain_screenshot.png',
    )

    expect(saver.askPath).toHaveBeenCalledWith('study/sub-01/brain_screenshot.png')
    expect(saver.write).toHaveBeenCalledWith('study/sub-01/brain_screenshot.png', body.data)
    expect(saver.saved).toHaveBeenCalledWith('study/sub-01/brain_screenshot.png')
    expect(saver.confirmReplace).not.toHaveBeenCalled()
  })

  it('saves to the path the user entered, relative to the workspace root', async () => {
    const saver = fakeSaver({ askPath: vi.fn(async () => ' /figures/scene.nvd ') })

    await saveToWorkspace({ ...body, filename: 'brain.nvd' }, 'study', saver)

    expect(saver.write).toHaveBeenCalledWith('figures/scene.nvd', body.data)
  })

  it('does nothing when the user cancels or clears the path', async () => {
    for (const answer of [null, '  ']) {
      const saver = fakeSaver({ askPath: vi.fn(async () => answer) })

      expect(await saveToWorkspace(body, 'study', saver)).toBeNull()

      expect(saver.write).not.toHaveBeenCalled()
    }
  })

  it('asks before replacing an existing file', async () => {
    const keep = fakeSaver({
      exists: vi.fn(async () => true),
      confirmReplace: vi.fn(async () => false),
    })
    const replace = fakeSaver({ exists: vi.fn(async () => true) })

    expect(await saveToWorkspace(body, '', keep)).toBeNull()
    expect(await saveToWorkspace(body, '', replace)).toBe('brain_screenshot.png')

    expect(keep.confirmReplace).toHaveBeenCalledWith('brain_screenshot.png')
    expect(keep.write).not.toHaveBeenCalled()
    expect(replace.write).toHaveBeenCalledTimes(1)
  })

  it('does not write when checking for an existing file fails', async () => {
    const error = new Error('Service Unavailable')
    const saver = fakeSaver({ exists: vi.fn(async () => Promise.reject(error)) })

    expect(await saveToWorkspace(body, 'study', saver)).toBeNull()

    expect(saver.write).not.toHaveBeenCalled()
    expect(saver.failed).toHaveBeenCalledWith('study/brain_screenshot.png', error)
  })

  it('reports a failed write', async () => {
    const error = new Error('Permission denied')
    const saver = fakeSaver({ write: vi.fn(async () => Promise.reject(error)) })

    expect(await saveToWorkspace(body, 'study', saver)).toBeNull()

    expect(saver.failed).toHaveBeenCalledWith('study/brain_screenshot.png', error)
    expect(saver.saved).not.toHaveBeenCalled()
  })

  it('ignores malformed messages without asking', async () => {
    const saver = fakeSaver()

    for (const malformed of [
      undefined,
      { ...body, data: undefined },
      { ...body, filename: 42 },
      { ...body, data: '!' },
    ]) {
      expect(await saveToWorkspace(malformed, 'study', saver)).toBeNull()
    }

    expect(saver.askPath).not.toHaveBeenCalled()
  })
})

describe('savedMessage', () => {
  it('names the saved path, and the paper to cite for a figure', () => {
    expect(savedMessage('study/brain_screenshot.png', true)).toBe(
      'Saved study/brain_screenshot.png. If you publish this figure, please cite Eckstein et al., Aperture Neuro 2026 (https://doi.org/10.52294/001c.167815).',
    )
    expect(savedMessage('study/brain.nvd', false)).toBe('Saved study/brain.nvd')
  })
})

describe('isNotFound', () => {
  it('is true only for a 404 response', () => {
    expect(isNotFound({ response: { status: 404 } })).toBe(true)
    expect(isNotFound({ response: { status: 503 } })).toBe(false)
    expect(isNotFound(new Error('offline'))).toBe(false)
    expect(isNotFound(null)).toBe(false)
  })
})

describe('suggestedSavePath', () => {
  it('keeps only the base name of the suggested file', () => {
    expect(suggestedSavePath('study/', '..\\..\\other/escape.png')).toBe('study/escape.png')
    expect(suggestedSavePath('', 'scene.nvd')).toBe('scene.nvd')
    expect(suggestedSavePath('/study', '..')).toBe('study/untitled')
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
