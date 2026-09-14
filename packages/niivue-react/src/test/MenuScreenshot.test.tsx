import { SLICE_TYPE } from '@niivue/niivue'
import { signal } from '@preact/signals'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProps, SelectionMode } from '../components/AppProps'
import { Menu } from '../components/Menu'
import { activeMenu } from '../components/MenuElements'
import { SAVE_HINT_MS } from '../components/SaveHint'
import { setFileSaver } from '../document'

// jsdom has no WebGL; the menu only needs the package's class and enums.
vi.mock('@niivue/niivue', () => {
  class NiiVueGPU {
    constructor(_opts?: unknown) {}
    attachToCanvas = vi.fn()
    addEventListener = vi.fn()
  }
  return {
    __esModule: true,
    default: NiiVueGPU,
    SLICE_TYPE: { AXIAL: 0, CORONAL: 1, SAGITTAL: 2, MULTIPLANAR: 3, RENDER: 4 },
    DRAG_MODE: {
      none: 0,
      contrast: 1,
      measurement: 2,
      pan: 3,
      slicer3D: 4,
      callbackOnly: 5,
      roiSelection: 6,
      angle: 7,
      crosshair: 8,
      windowing: 9,
    },
  }
})

// The capture itself is covered in screenshot.test.ts; here it returns fixed
// bytes so the menu's choice of tiles, file name and save path can be checked.
const PNG_BYTES = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3])
const captureScreenshot = vi.fn()
vi.mock('../screenshot', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../screenshot')>()),
  captureScreenshot: (...args: unknown[]) => captureScreenshot(...args),
}))

type Download = { name: string; href: string }
let downloads: Download[]
let blobs: Blob[]

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn()
  HTMLDialogElement.prototype.close = vi.fn()
})

beforeEach(() => {
  downloads = []
  blobs = []
  captureScreenshot.mockResolvedValue(PNG_BYTES)
  // jsdom implements neither object URLs nor download navigation.
  URL.createObjectURL = vi.fn((blob: Blob) => {
    blobs.push(blob)
    return `blob:screenshot-${blobs.length}`
  })
  URL.revokeObjectURL = vi.fn()
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    downloads.push({ name: this.download, href: this.href })
  })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  captureScreenshot.mockReset()
  activeMenu.value = null
})

function makeNv(name: string, extra: Record<string, unknown> = {}) {
  return {
    volumes: [{ name, hdr: { dims: [3, 64, 64, 40, 1], pixDims: [1, 1, 1, 1] }, nFrame4D: 1 }],
    meshes: [],
    opts: {},
    drawScene: vi.fn(),
    ...extra,
  }
}

function makeProps(nvs: unknown[], menuItems: Record<string, boolean> = { screenshot: true }) {
  return {
    nvArray: signal(nvs),
    selection: signal([0]),
    selectionMode: signal(SelectionMode.SINGLE),
    sliceType: signal(SLICE_TYPE.MULTIPLANAR),
    hideUI: signal(3),
    settings: signal({
      interpolation: true,
      showCrosshairs: true,
      radiologicalConvention: false,
      colorbar: false,
      zoomDragMode: false,
      menuItems,
    }),
  } as unknown as AppProps
}

const screenshotButton = () => screen.queryByRole('button', { name: 'Screenshot' })

describe('Screenshot menu visibility', () => {
  it('is hidden until a volume or mesh is loaded', () => {
    render(<Menu {...makeProps([{ volumes: [], meshes: [], opts: {}, drawScene: vi.fn() }])} />)
    expect(screenshotButton()).toBeNull()
  })

  it('is hidden when the host turns it off', () => {
    render(<Menu {...makeProps([makeNv('brain.nii.gz')], { screenshot: false })} />)
    expect(screenshotButton()).toBeNull()
  })

  it('shows for a loaded mesh', () => {
    const mesh = {
      volumes: [],
      meshes: [{ name: 'lh.pial', layers: [] }],
      opts: {},
      drawScene: vi.fn(),
    }
    render(<Menu {...makeProps([mesh])} />)
    expect(screenshotButton()).not.toBeNull()
  })

  it('offers only "All tiles" for a single tile', async () => {
    render(<Menu {...makeProps([makeNv('brain.nii.gz')])} />)

    fireEvent.click(screen.getByTestId('menu-item-dropdown-Screenshot'))

    expect(await screen.findByText('All tiles')).toBeTruthy()
    expect(screen.queryByText('Selected tile')).toBeNull()
  })
})

describe('Screenshot in a standalone host (web, desktop, Streamlit)', () => {
  it('clicking the label captures the tiles and downloads a PNG named after the image', async () => {
    const background = [0.2, 0.2, 0.2, 1]
    const nv = makeNv('data/sub-01_T1w.nii.gz', { backgroundColor: background })
    render(<Menu {...makeProps([nv])} />)

    fireEvent.click(screenshotButton()!)

    await waitFor(() => expect(downloads).toHaveLength(1))
    expect(captureScreenshot).toHaveBeenCalledWith([nv], background)
    expect(downloads[0].name).toBe('sub-01_T1w_screenshot.png')
    expect(blobs[0].type).toBe('image/png')
    expect(blobs[0].size).toBe(PNG_BYTES.length)
  })

  it('"All tiles" captures every tile over the first tile\'s background', async () => {
    const nvs = [
      makeNv('a.nii.gz', { backgroundColor: [0.2, 0.2, 0.2, 1] }),
      makeNv('b.nii.gz', { backgroundColor: [1, 0, 0, 1] }),
    ]
    render(<Menu {...makeProps(nvs)} />)

    fireEvent.click(screen.getByTestId('menu-item-dropdown-Screenshot'))
    fireEvent.click(await screen.findByText('All tiles'))

    await waitFor(() => expect(downloads).toHaveLength(1))
    expect(captureScreenshot).toHaveBeenCalledWith(nvs, [0.2, 0.2, 0.2, 1])
    // Without an active selection the last tile is the scene target, as for
    // NVDocument.
    expect(downloads[0].name).toBe('b_screenshot.png')
  })

  it('"Selected tile" captures only the selected tile', async () => {
    const nvs = [makeNv('a.nii.gz'), makeNv('b.nii.gz'), makeNv('c.nii.gz')]
    const props = makeProps(nvs)
    render(<Menu {...props} />)
    fireEvent.click(screen.getByRole('button', { name: 'Select' }))
    props.selection.value = [1]

    fireEvent.click(screen.getByTestId('menu-item-dropdown-Screenshot'))
    fireEvent.click(await screen.findByText('Selected tile'))

    await waitFor(() => expect(downloads).toHaveLength(1))
    expect(captureScreenshot).toHaveBeenCalledWith([nvs[1]], undefined)
    expect(downloads[0].name).toBe('b_screenshot.png')
  })

  it('falls back to niivue_screenshot.png when the image has no usable name', async () => {
    render(<Menu {...makeProps([makeNv('.nii.gz')])} />)

    fireEvent.click(screenshotButton()!)

    await waitFor(() => expect(downloads).toHaveLength(1))
    expect(downloads[0].name).toBe('niivue_screenshot.png')
  })

  it('saves nothing when no tile is on screen', async () => {
    captureScreenshot.mockResolvedValue(null)
    render(<Menu {...makeProps([makeNv('brain.nii.gz')])} />)

    fireEvent.click(screenshotButton()!)

    await waitFor(() => expect(captureScreenshot).toHaveBeenCalled())
    // Let the resolved capture reach the save step before checking.
    await new Promise((resolve) => setTimeout(resolve))
    expect(downloads).toHaveLength(0)
  })

  it('logs a failed capture instead of throwing', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    captureScreenshot.mockRejectedValue(new Error('encoder failed'))
    render(<Menu {...makeProps([makeNv('brain.nii.gz')])} />)

    fireEvent.click(screenshotButton()!)

    await waitFor(() => expect(error).toHaveBeenCalledWith('Screenshot failed:', expect.any(Error)))
    expect(downloads).toHaveLength(0)
  })
})

describe('Screenshot in a webview host (VS Code, JupyterLab)', () => {
  const postMessage = vi.fn()
  beforeAll(() => {
    ;(globalThis as any).vscode = { postMessage }
  })
  afterAll(() => {
    delete (globalThis as any).vscode
  })
  afterEach(() => postMessage.mockReset())

  it('is offered like on standalone hosts', () => {
    render(<Menu {...makeProps([makeNv('brain.nii.gz')])} />)
    expect(screenshotButton()).not.toBeNull()
  })

  it('sends the PNG to the host as a base64 saveFile message instead of downloading', async () => {
    render(<Menu {...makeProps([makeNv('brain.nii.gz')])} />)

    fireEvent.click(screenshotButton()!)

    await waitFor(() => expect(postMessage).toHaveBeenCalledTimes(1))
    expect(postMessage).toHaveBeenCalledWith({
      type: 'saveFile',
      body: {
        filename: 'brain_screenshot.png',
        mimeType: 'image/png',
        data: Buffer.from(PNG_BYTES).toString('base64'),
        cite: true,
      },
    })
    expect(downloads).toHaveLength(0)
    // The host reports the save and the citation itself.
    expect(screen.queryByTestId('save-hint')).toBeNull()
  })
})

describe('Hint after saving a screenshot', () => {
  afterEach(() => {
    setFileSaver(null)
    vi.useRealTimers()
  })

  it('names the downloaded file and the paper to cite', async () => {
    render(<Menu {...makeProps([makeNv('brain.nii.gz')])} />)

    fireEvent.click(screenshotButton()!)

    const hint = await screen.findByTestId('save-hint')
    expect(hint.textContent).toContain('Saved brain_screenshot.png.')
    expect(hint.textContent).toContain('please cite Eckstein et al., Aperture Neuro 2026')
    expect(hint.querySelector('a')?.getAttribute('href')).toBe(
      'https://doi.org/10.52294/001c.167815',
    )
  })

  it('shows where a host saver put the file, and nothing when it was cancelled', async () => {
    const saver = vi.fn(async () => '/home/user/figures/brain_screenshot.png')
    setFileSaver(saver)
    render(<Menu {...makeProps([makeNv('brain.nii.gz')])} />)

    fireEvent.click(screenshotButton()!)

    expect((await screen.findByTestId('save-hint')).textContent).toContain(
      'Saved /home/user/figures/brain_screenshot.png.',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByTestId('save-hint')).toBeNull()

    saver.mockResolvedValueOnce(null as unknown as string)
    fireEvent.click(screenshotButton()!)
    await waitFor(() => expect(saver).toHaveBeenCalledTimes(2))
    expect(screen.queryByTestId('save-hint')).toBeNull()
  })

  it('hides itself after a while', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    render(<Menu {...makeProps([makeNv('brain.nii.gz')])} />)

    fireEvent.click(screenshotButton()!)
    await screen.findByTestId('save-hint')
    await vi.advanceTimersByTimeAsync(SAVE_HINT_MS + 100)

    await waitFor(() => expect(screen.queryByTestId('save-hint')).toBeNull())
  })

  it('does not appear after saving a scene document', async () => {
    const nv = makeNv('brain.nii.gz', { serializeDocument: () => new Uint8Array([1, 2]) })
    render(<Menu {...makeProps([nv], { saveScene: true, screenshot: true })} />)

    fireEvent.click(screen.getByRole('button', { name: 'NVDocument' }))

    await waitFor(() => expect(downloads.map((d) => d.name)).toEqual(['brain.nvd']))
    expect(screen.queryByTestId('save-hint')).toBeNull()
  })
})
