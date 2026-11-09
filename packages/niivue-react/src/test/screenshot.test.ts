import { Blob as NodeBlob } from 'node:buffer'
import { crc32 as zlibCrc32 } from 'node:zlib'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CITATION_DOI_URL } from '../citation'
import {
  SCREENSHOT_METADATA,
  SCREENSHOT_SCALE,
  ScreenshotPanel,
  captureScreenshot,
  placePanels,
  rgbaToCss,
  waitUntilRenderable,
} from '../screenshot'

type Rect = { left: number; top: number; width: number; height: number }

// jsdom has no 2D canvas; a fake context records what the capture draws, into
// the same log the fake panels write their render and resize calls to.
let log: string[]
let ctx: { fillStyle: string; fillRect: (...a: number[]) => void; drawImage: (...a: any[]) => void }

// A 1x1 PNG standing in for the browser's canvas encoder output.
const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

/** Make toBlob succeed, recording the size of the canvas it encodes. */
function mockEncoder() {
  const encoded = { size: '' }
  // jsdom's Blob has no arrayBuffer(); Node's matches the browser API.
  const blob = new NodeBlob([tinyPng], { type: 'image/png' }) as unknown as Blob
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
    this: HTMLCanvasElement,
    callback,
  ) {
    encoded.size = `${this.width}x${this.height}`
    callback(blob)
  })
  return encoded
}

// A panel like a NiiVue instance: its devicePixelRatio setter resizes the
// backing store to the floor of CSS size times the ratio (<= 0: the display's).
function panel(id: string, rect: Rect | null, overrides: Partial<ScreenshotPanel> = {}) {
  const sized = (ratio: number) => {
    const r = ratio > 0 ? ratio : window.devicePixelRatio || 1
    return { width: Math.floor(rect!.width * r), height: Math.floor(rect!.height * r) }
  }
  const canvas = rect && {
    id,
    isConnected: true,
    ...sized(-1),
    getBoundingClientRect: () => ({
      ...rect,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
    }),
  }
  const view = {
    render: () => log.push(`render ${id}`),
    isBusy: false,
    forceDevicePixelRatio: -1,
  } as NonNullable<ScreenshotPanel['view']> & { isBusy: boolean; forceDevicePixelRatio: number }
  const p = {
    canvas: canvas as unknown as HTMLCanvasElement,
    view,
    drawScene: () => log.push(`drawScene ${id}`),
    ...overrides,
  }
  Object.defineProperty(p, 'devicePixelRatio', {
    configurable: true,
    set(ratio: number) {
      log.push(`ratio ${id} ${ratio}`)
      view.forceDevicePixelRatio = ratio
      if (canvas) Object.assign(canvas, sized(ratio))
    },
  })
  return p as typeof p & { view: typeof view }
}

function setPixelRatio(value: number) {
  Object.defineProperty(window, 'devicePixelRatio', { value, configurable: true })
}

beforeEach(() => {
  log = []
  ctx = {
    fillStyle: '',
    fillRect: (...a) => log.push(`fill ${ctx.fillStyle} ${a.join(',')}`),
    drawImage: (canvas, ...a) =>
      log.push(`draw ${canvas.id} ${a.join(',')} ${canvas.width}x${canvas.height}`),
  }
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as any)
  setPixelRatio(1)
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  setPixelRatio(1)
})

describe('placePanels', () => {
  it('keeps the on-screen layout relative to the top-left tile, gaps included', () => {
    const placed = placePanels(
      [
        panel('a', { left: 104, top: 52, width: 100, height: 80 }),
        panel('b', { left: 208, top: 52, width: 100, height: 80 }),
        panel('c', { left: 104, top: 136, width: 100, height: 80 }),
      ],
      1,
    )

    expect(placed.map(({ x, y, width, height }) => [x, y, width, height])).toEqual([
      [0, 0, 100, 80],
      [104, 0, 100, 80],
      [0, 84, 100, 80],
    ])
  })

  it('scales positions by rounding and sizes by flooring, like NiiVue', () => {
    const placed = placePanels(
      [
        panel('a', { left: 0.4, top: 0, width: 101, height: 33 }),
        panel('b', { left: 105.3, top: 0, width: 101, height: 33 }),
      ],
      1.25,
    )

    expect(placed.map(({ x, y, width, height }) => [x, y, width, height])).toEqual([
      [0, 0, 126, 41],
      [131, 0, 126, 41],
    ])
  })

  it('skips panels whose canvas is missing, detached, not laid out or empty', () => {
    const detached = panel('detached', { left: 500, top: 500, width: 10, height: 10 })
    ;(detached.canvas as any).isConnected = false
    const empty = panel('empty', { left: 0, top: 0, width: 10, height: 10 })
    ;(empty.canvas as any).width = 0

    const placed = placePanels(
      [
        panel('none', null),
        detached,
        panel('collapsed', { left: 900, top: 900, width: 0, height: 0 }),
        empty,
        panel('shown', { left: 20, top: 30, width: 10, height: 10 }),
      ],
      2,
    )

    expect(placed.map(({ nv, x, y }) => [(nv.canvas as any).id, x, y])).toEqual([['shown', 0, 0]])
  })
})

describe('captureScreenshot', () => {
  it('renders each tile at twice the screen resolution, copies it, then restores it', async () => {
    const encoded = mockEncoder()
    const a = panel('a', { left: 0, top: 0, width: 10, height: 10 })
    const b = panel('b', { left: 14, top: 0, width: 10, height: 10 })

    await captureScreenshot([a, b])

    expect(SCREENSHOT_SCALE).toBe(2)
    expect(log).toEqual([
      'fill rgb(0, 0, 0) 0,0,48,20',
      'ratio a 2',
      'drawScene a',
      'render a',
      'draw a 0,0 20x20',
      'ratio a -1',
      'ratio b 2',
      'drawScene b',
      'render b',
      'draw b 28,0 20x20',
      'ratio b -1',
    ])
    expect(encoded.size).toBe('48x20')
    expect([(a.canvas as any).width, (b.canvas as any).width]).toEqual([10, 10])
  })

  it('doubles the display pixel ratio', async () => {
    const encoded = mockEncoder()
    setPixelRatio(1.5)
    await captureScreenshot([panel('a', { left: 0, top: 0, width: 10, height: 10 })])

    expect(log).toContain('ratio a 3')
    expect(encoded.size).toBe('30x30')
  })

  it('fills the whole image with the viewer background before drawing', async () => {
    mockEncoder()
    await captureScreenshot(
      [
        panel('a', { left: 0, top: 0, width: 10, height: 10 }),
        panel('b', { left: 0, top: 20, width: 10, height: 10 }),
      ],
      [0.1, 0.2, 0.3, 1],
    )

    expect(log[0]).toBe('fill rgba(26, 51, 77, 1) 0,0,20,60')
  })

  it('still copies a panel whose view is not attached yet', async () => {
    mockEncoder()
    await captureScreenshot([
      panel('a', { left: 0, top: 0, width: 10, height: 10 }, { view: null }),
    ])

    expect(log).toEqual([
      'fill rgb(0, 0, 0) 0,0,20,20',
      'ratio a 2',
      'drawScene a',
      'draw a 0,0 20x20',
      'ratio a -1',
    ])
  })

  it('keeps a tile within the GPU texture limit', async () => {
    mockEncoder()
    const wide = panel('wide', { left: 0, top: 0, width: 3000, height: 100 })
    Object.assign(wide.view, { device: { limits: { maxTextureDimension2D: 4096 } } })

    await captureScreenshot([wide])

    expect(log[1]).toBe(`ratio wide ${4096 / 3000}`)
    expect(log.find((l) => l.startsWith('draw '))).toBe('draw wide 0,0 4096x136')
  })

  it('stays within the pixel budget for a large layout', async () => {
    mockEncoder()
    await captureScreenshot([
      panel('a', { left: 0, top: 0, width: 4000, height: 4000 }),
      panel('b', { left: 4000, top: 0, width: 4000, height: 4000 }),
    ])

    const ratio = Number(log[1].split(' ').pop())
    expect(ratio).toBeCloseTo(Math.sqrt((8192 * 8192) / (8000 * 4000)))
  })

  it('never renders below the on-screen resolution', async () => {
    mockEncoder()
    setPixelRatio(2)
    await captureScreenshot([panel('huge', { left: 0, top: 0, width: 5000, height: 100 })])

    expect(log[1]).toBe('ratio huge 2')
  })

  it('scales the crosshair width with the export and restores it', async () => {
    mockEncoder()
    const a = panel('a', { left: 0, top: 0, width: 10, height: 10 })
    let width = 1
    Object.defineProperty(a, 'crosshairWidth', {
      get: () => width,
      set: (value: number) => {
        width = value
        log.push(`crosshair a ${value}`)
      },
    })

    await captureScreenshot([a])

    expect(log).toEqual([
      'fill rgb(0, 0, 0) 0,0,20,20',
      'ratio a 2',
      'crosshair a 2',
      'drawScene a',
      'render a',
      'draw a 0,0 20x20',
      'crosshair a 1',
      'ratio a -1',
    ])
  })

  it("scales each crosshair by its tile's own on-screen ratio", async () => {
    mockEncoder()
    setPixelRatio(2)
    const crosshair = (p: ReturnType<typeof panel>, id: string) => {
      let width = 1
      Object.defineProperty(p, 'crosshairWidth', {
        get: () => width,
        set: (value: number) => {
          width = value
          log.push(`crosshair ${id} ${value}`)
        },
      })
      return p
    }
    // `forced` renders at a fixed ratio of 1 on this ratio-2 display.
    const forced = crosshair(panel('forced', { left: 0, top: 0, width: 10, height: 10 }), 'forced')
    forced.view.forceDevicePixelRatio = 1
    Object.assign(forced.canvas!, { width: 10, height: 10 })
    const plain = crosshair(panel('plain', { left: 20, top: 0, width: 10, height: 10 }), 'plain')

    await captureScreenshot([forced, plain])

    expect(log.filter((l) => /^(ratio|crosshair) /.test(l))).toEqual([
      'ratio forced 4',
      'crosshair forced 4',
      'crosshair forced 1',
      'ratio forced 1',
      'ratio plain 4',
      'crosshair plain 2',
      'crosshair plain 1',
      'ratio plain -1',
    ])
  })

  it('doubles the sharpest on-screen ratio when a tile forces a higher one', async () => {
    mockEncoder()
    const sharp = panel('sharp', { left: 0, top: 0, width: 10, height: 10 })
    sharp.view.forceDevicePixelRatio = 2
    Object.assign(sharp.canvas!, { width: 20, height: 20 })

    await captureScreenshot([sharp, panel('plain', { left: 20, top: 0, width: 10, height: 10 })])

    expect(log.filter((l) => l.startsWith('ratio '))).toEqual([
      'ratio sharp 4',
      'ratio sharp 2',
      'ratio plain 4',
      'ratio plain -1',
    ])
  })

  it('keeps every tile within its GPU limit when tiles render at different ratios', async () => {
    mockEncoder()
    const sharp = panel('sharp', { left: 0, top: 0, width: 100, height: 100 })
    sharp.view.forceDevicePixelRatio = 4
    Object.assign(sharp.canvas!, { width: 400, height: 400 })
    const wide = panel('wide', { left: 100, top: 0, width: 3000, height: 100 })
    Object.assign(wide.view, { device: { limits: { maxTextureDimension2D: 8192 } } })

    await captureScreenshot([sharp, wide])

    expect(log).toContain(`ratio wide ${8192 / 3000}`)
    expect(log.find((l) => l.startsWith('draw wide'))).toMatch(/ 8192x273$/)
  })

  it('restores the canvas size when restoring the crosshair width throws', async () => {
    mockEncoder()
    const a = panel('a', { left: 0, top: 0, width: 10, height: 10 })
    let width = 1
    Object.defineProperty(a, 'crosshairWidth', {
      get: () => width,
      set: (value: number) => {
        if (value === 1) throw new Error('drawScene failed')
        width = value
      },
    })

    await expect(captureScreenshot([a])).rejects.toThrow('drawScene failed')

    expect(log[log.length - 1]).toBe('ratio a -1')
    expect(a.canvas).toMatchObject({ width: 10, height: 10 })
  })

  it('measures the layout only once every tile is ready', async () => {
    const encoded = mockEncoder()
    const rect = { left: 0, top: 0, width: 10, height: 10 }
    const a = panel('a', rect)
    a.view.isBusy = true
    setTimeout(() => {
      rect.width = 8
      a.view.isBusy = false
    }, 80)

    await captureScreenshot([a])

    expect(encoded.size).toBe('16x20')
    expect(log).toContain('draw a 0,0 16x20')
  })

  it('copies all tiles in one pass after every tile is ready', async () => {
    mockEncoder()
    const a = panel('a', { left: 0, top: 0, width: 10, height: 10 })
    const b = panel('b', { left: 20, top: 0, width: 10, height: 10 })
    b.view.isBusy = true
    setTimeout(() => {
      log.push('b idle')
      b.view.isBusy = false
    }, 80)

    await captureScreenshot([a, b])

    expect(log.indexOf('b idle')).toBeLessThan(log.indexOf('ratio a 2'))
  })

  it('starts the pass again when a tile turns busy after enlarging', async () => {
    mockEncoder()
    const a = panel('a', { left: 0, top: 0, width: 10, height: 10 })
    let enlargements = 0
    Object.defineProperty(a, 'devicePixelRatio', {
      set(ratio: number) {
        log.push(`ratio a ${ratio}`)
        if (ratio > 0 && enlargements++ === 0) {
          a.view.isBusy = true
          setTimeout(() => (a.view.isBusy = false), 80)
        }
      },
    })

    await captureScreenshot([a])

    expect(log.filter((l) => l.startsWith('ratio') || l.startsWith('draw '))).toEqual([
      'ratio a 2',
      'ratio a -1',
      'ratio a 2',
      'draw a 0,0 10x10',
      'ratio a -1',
    ])
  })

  it('keeps a crosshair change made while waiting for a busy tile', async () => {
    mockEncoder()
    const a = panel('a', { left: 0, top: 0, width: 10, height: 10 })
    let width = 1
    Object.defineProperty(a, 'crosshairWidth', {
      get: () => width,
      set: (value: number) => {
        width = value
        log.push(`crosshair a ${value}`)
      },
    })
    a.view.isBusy = true
    setTimeout(() => {
      width = 0 // the user hides the crosshair
      a.view.isBusy = false
    }, 80)

    await captureScreenshot([a])

    expect(width).toBe(0)
    expect(log.filter((l) => l.startsWith('crosshair'))).toEqual([])
  })

  it('waits for a busy view before rendering and copying it', async () => {
    mockEncoder()
    const busy = panel('a', { left: 0, top: 0, width: 10, height: 10 })
    busy.view.isBusy = true
    setTimeout(() => {
      log.push('idle')
      busy.view.isBusy = false
    }, 80)

    await captureScreenshot([busy])

    expect(log.indexOf('idle')).toBeLessThan(log.indexOf('render a'))
  })

  it('enlarges nothing while a tile stays busy', async () => {
    vi.useFakeTimers()
    const stuck = panel('a', { left: 0, top: 0, width: 10, height: 10 })
    stuck.view.isBusy = true
    const next = panel('b', { left: 20, top: 0, width: 10, height: 10 })

    const capture = expect(captureScreenshot([stuck, next])).rejects.toThrow('still busy')
    await vi.advanceTimersByTimeAsync(5100)
    await capture

    expect(log).toEqual([])
  })

  it('gives up when tiles keep turning busy after enlarging', async () => {
    mockEncoder()
    const a = panel('a', { left: 0, top: 0, width: 10, height: 10 })
    Object.defineProperty(a, 'devicePixelRatio', {
      set(ratio: number) {
        log.push(`ratio a ${ratio}`)
        a.view.isBusy = ratio > 0
      },
    })

    await expect(captureScreenshot([a])).rejects.toThrow('still busy')
    expect(log.filter((l) => l.startsWith('draw '))).toEqual([])
    expect(a.view.isBusy).toBe(false)
  })

  it('runs overlapping captures one after the other', async () => {
    mockEncoder()
    const a = panel('a', { left: 0, top: 0, width: 10, height: 10 })
    a.view.isBusy = true
    setTimeout(() => (a.view.isBusy = false), 80)

    await Promise.all([captureScreenshot([a]), captureScreenshot([a])])

    expect(log.filter((l) => l.startsWith('ratio'))).toEqual([
      'ratio a 2',
      'ratio a -1',
      'ratio a 2',
      'ratio a -1',
    ])
    expect(a.view.forceDevicePixelRatio).toBe(-1)
  })

  it('encodes the composite as a PNG that carries the citation', async () => {
    mockEncoder()

    const png = await captureScreenshot([panel('a', { left: 0, top: 0, width: 10, height: 10 })])

    const text = Buffer.from(png!).toString('latin1')
    expect(text.startsWith('\x89PNG')).toBe(true)
    expect(text).toContain(`Software\0${SCREENSHOT_METADATA.Software}`)
    expect(text).toContain(`Comment\0${SCREENSHOT_METADATA.Comment}`)
    expect(SCREENSHOT_METADATA.Comment).toContain(CITATION_DOI_URL)
    expect(SCREENSHOT_METADATA.Comment).toContain('The NiiVue wrapper ecosystem')
  })

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

  it('resolves to null without resizing or encoding when nothing is on screen', async () => {
    const toBlob = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob')
    expect(await captureScreenshot([panel('none', null)])).toBeNull()
    expect(toBlob).not.toHaveBeenCalled()
    expect(log).toEqual([])
  })

  it('fails loudly when the browser cannot encode the canvas', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(null))
    await expect(
      captureScreenshot([panel('a', { left: 0, top: 0, width: 10, height: 10 })]),
    ).rejects.toThrow('Could not encode')
  })
})

describe('waitUntilRenderable', () => {
  it('does not wait for a busy panel that is not on screen', async () => {
    const hidden = panel('hidden', { left: 0, top: 0, width: 10, height: 10 })
    hidden.view.isBusy = true
    ;(hidden.canvas as any).isConnected = false

    await expect(
      waitUntilRenderable([hidden, panel('a', { left: 0, top: 0, width: 10, height: 10 })], 120),
    ).resolves.toBeUndefined()
  })

  it('does not wait for the font renderer on WebGL2, which renders without it', async () => {
    const webgl2 = panel(
      'a',
      { left: 0, top: 0, width: 10, height: 10 },
      { opts: { backend: 'webgl2' } },
    )
    Object.assign(webgl2.view, { fontRenderer: { isReady: false } })

    await expect(waitUntilRenderable([webgl2], 120)).resolves.toBeUndefined()
  })

  it('gives up with an error while the WebGPU font renderer is not ready', async () => {
    const webgpu = panel('a', { left: 0, top: 0, width: 10, height: 10 })
    Object.assign(webgpu.view, { fontRenderer: { isReady: false } })

    await expect(waitUntilRenderable([webgpu], 120)).rejects.toThrow('still busy')
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
