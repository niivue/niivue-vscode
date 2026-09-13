import { Blob as NodeBlob } from 'node:buffer'
import { crc32 as zlibCrc32 } from 'node:zlib'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CITATION_DOI_URL } from '../citation'
import {
  SCREENSHOT_METADATA,
  ScreenshotPanel,
  captureScreenshot,
  compositePanels,
  rgbaToCss,
} from '../screenshot'

type Rect = { left: number; top: number; width: number; height: number }

// jsdom has no 2D canvas; a fake context records what the compositor draws,
// into the same log the fake panels write their render calls to.
let log: string[]
let ctx: { fillStyle: string; fillRect: (...a: number[]) => void; drawImage: (...a: any[]) => void }

function panel(id: string, rect: Rect | null, overrides: Partial<ScreenshotPanel> = {}) {
  const canvas = rect && {
    id,
    isConnected: true,
    getBoundingClientRect: () => ({
      ...rect,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
    }),
  }
  return {
    canvas: canvas as unknown as HTMLCanvasElement,
    view: { render: () => log.push(`render ${id}`) },
    drawScene: () => log.push(`drawScene ${id}`),
    ...overrides,
  }
}

function setPixelRatio(value: number) {
  Object.defineProperty(window, 'devicePixelRatio', { value, configurable: true })
}

beforeEach(() => {
  log = []
  ctx = {
    fillStyle: '',
    fillRect: (...a) => log.push(`fill ${ctx.fillStyle} ${a.join(',')}`),
    drawImage: (canvas, ...a) => log.push(`draw ${canvas.id} ${a.join(',')}`),
  }
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as any)
  setPixelRatio(1)
})

afterEach(() => {
  vi.restoreAllMocks()
  setPixelRatio(1)
})

describe('compositePanels', () => {
  it('renders and copies each panel before moving on to the next', () => {
    compositePanels([
      panel('a', { left: 0, top: 0, width: 10, height: 10 }),
      panel('b', { left: 14, top: 0, width: 10, height: 10 }),
    ])

    expect(log).toEqual([
      'fill rgb(0, 0, 0) 0,0,24,10',
      'drawScene a',
      'render a',
      'draw a 0,0,10,10',
      'drawScene b',
      'render b',
      'draw b 14,0,10,10',
    ])
  })

  it('keeps the on-screen layout relative to the top-left tile, gaps included', () => {
    const out = compositePanels([
      panel('a', { left: 104, top: 52, width: 100, height: 80 }),
      panel('b', { left: 208, top: 52, width: 100, height: 80 }),
      panel('c', { left: 104, top: 136, width: 100, height: 80 }),
    ])!

    expect([out.width, out.height]).toEqual([204, 164])
    expect(log.filter((l) => l.startsWith('draw '))).toEqual([
      'draw a 0,0,100,80',
      'draw b 104,0,100,80',
      'draw c 0,84,100,80',
    ])
  })

  it('scales positions and sizes by devicePixelRatio', () => {
    setPixelRatio(2)
    const out = compositePanels([
      panel('a', { left: 4, top: 4, width: 100, height: 50 }),
      panel('b', { left: 108, top: 4, width: 100, height: 50 }),
    ])!

    expect([out.width, out.height]).toEqual([408, 100])
    expect(log.filter((l) => l.startsWith('draw '))).toEqual([
      'draw a 0,0,200,100',
      'draw b 208,0,200,100',
    ])
  })

  it('rounds fractional device pixels', () => {
    setPixelRatio(1.25)
    const out = compositePanels([panel('a', { left: 0.4, top: 0, width: 101, height: 33 })])!

    expect([out.width, out.height]).toEqual([126, 41])
    expect(log.filter((l) => l.startsWith('draw '))).toEqual(['draw a 0,0,126,41'])
  })

  it('fills the whole output with the viewer background before drawing', () => {
    compositePanels(
      [
        panel('a', { left: 0, top: 0, width: 10, height: 10 }),
        panel('b', { left: 0, top: 20, width: 10, height: 10 }),
      ],
      [0.1, 0.2, 0.3, 1],
    )

    expect(log[0]).toBe('fill rgba(26, 51, 77, 1) 0,0,10,30')
  })

  it('skips panels whose canvas is missing, detached or not laid out', () => {
    const detached = panel('detached', { left: 500, top: 500, width: 10, height: 10 })
    ;(detached.canvas as any).isConnected = false
    const out = compositePanels([
      panel('none', null),
      detached,
      panel('collapsed', { left: 900, top: 900, width: 0, height: 0 }),
      panel('shown', { left: 20, top: 30, width: 10, height: 10 }),
    ])!

    expect([out.width, out.height]).toEqual([10, 10])
    expect(log).toEqual([
      'fill rgb(0, 0, 0) 0,0,10,10',
      'drawScene shown',
      'render shown',
      'draw shown 0,0,10,10',
    ])
  })

  it('still copies a panel whose view is not attached yet', () => {
    compositePanels([panel('a', { left: 0, top: 0, width: 10, height: 10 }, { view: null })])

    expect(log).toEqual(['fill rgb(0, 0, 0) 0,0,10,10', 'drawScene a', 'draw a 0,0,10,10'])
  })

  it('returns null when no panel is on screen', () => {
    expect(compositePanels([])).toBeNull()
    expect(compositePanels([panel('none', null)])).toBeNull()
    expect(log).toEqual([])
  })
})

describe('rgbaToCss', () => {
  it('converts 0-1 channels and clamps out-of-range values', () => {
    expect(rgbaToCss([1, 0.5, 0, 0.25])).toBe('rgba(255, 128, 0, 0.25)')
    expect(rgbaToCss([2, -1, 0.2])).toBe('rgba(255, 0, 51, 1)')
  })

  it('falls back to black for a missing or malformed color', () => {
    expect(rgbaToCss(undefined)).toBe('rgb(0, 0, 0)')
    expect(rgbaToCss([0.5, 0.5])).toBe('rgb(0, 0, 0)')
    expect(rgbaToCss([NaN, 0, 0, 1])).toBe('rgb(0, 0, 0)')
  })
})

describe('captureScreenshot', () => {
  // A 1x1 PNG standing in for the browser's canvas encoder output.
  const tinyPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'base64',
  )

  it('uses a fixture with valid chunk CRCs', () => {
    let offset = 8
    while (offset < tinyPng.length) {
      const length = tinyPng.readUInt32BE(offset)
      const crc = tinyPng.readUInt32BE(offset + 8 + length)
      expect(crc).toBe(zlibCrc32(tinyPng.subarray(offset + 4, offset + 8 + length)))
      offset += 12 + length
    }
    expect(offset).toBe(tinyPng.length)
  })

  it('encodes the composite as a PNG that carries the citation', async () => {
    // jsdom's Blob has no arrayBuffer(); Node's matches the browser API.
    const encoded = new NodeBlob([tinyPng], { type: 'image/png' }) as unknown as Blob
    const toBlob = vi
      .spyOn(HTMLCanvasElement.prototype, 'toBlob')
      .mockImplementation((callback) => callback(encoded))

    const png = await captureScreenshot([panel('a', { left: 0, top: 0, width: 10, height: 10 })])

    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png')
    const text = Buffer.from(png!).toString('latin1')
    expect(text.startsWith('\x89PNG')).toBe(true)
    expect(text).toContain(`Software\0${SCREENSHOT_METADATA.Software}`)
    expect(text).toContain(`Comment\0${SCREENSHOT_METADATA.Comment}`)
    expect(SCREENSHOT_METADATA.Comment).toContain(CITATION_DOI_URL)
    expect(SCREENSHOT_METADATA.Comment).toContain('The NiiVue wrapper ecosystem')
  })

  it('resolves to null without encoding when nothing is on screen', async () => {
    const toBlob = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob')
    expect(await captureScreenshot([panel('none', null)])).toBeNull()
    expect(toBlob).not.toHaveBeenCalled()
  })

  it('fails loudly when the browser cannot encode the canvas', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(null))
    await expect(
      captureScreenshot([panel('a', { left: 0, top: 0, width: 10, height: 10 })]),
    ).rejects.toThrow('Could not encode')
  })
})
