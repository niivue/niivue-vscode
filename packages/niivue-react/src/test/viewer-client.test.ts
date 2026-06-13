import { signal } from '@preact/signals'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppProps } from '../components/AppProps'

// The facade is a thin wrapper over the message bus; mock it so these are true
// unit tests (no niivue, no WebGL). handleMessage is the only runtime import.
const handleMessage = vi.fn(async (..._args: unknown[]) => true)
vi.mock('../events', () => ({
  handleMessage: (...args: unknown[]) => handleMessage(...args),
}))

import { createViewerClient } from '../viewer-client'

function makeAppProps(nvArray: unknown[] = [], selection: number[] = []): AppProps {
  return {
    nvArray: signal(nvArray),
    selection: signal(selection),
    location: signal(''),
  } as unknown as AppProps
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

beforeEach(() => handleMessage.mockClear())

describe('createViewerClient (ViewerClient facade)', () => {
  it('applyDocument posts a loadDocument message carrying the document', async () => {
    const client = createViewerClient(makeAppProps())
    const doc = { title: 'scene.nvd', encodedImageBlobs: ['x'] }
    await client.applyDocument(doc as never)
    expect(handleMessage).toHaveBeenCalledWith(
      { type: 'loadDocument', body: { document: doc, name: 'scene.nvd' } },
      expect.anything(),
    )
  })

  it('applyPatch maps "add /volumes/-" to an addImage message', async () => {
    const client = createViewerClient(makeAppProps())
    const body = { data: new ArrayBuffer(0), uri: 'a.nii' }
    await client.applyPatch([{ op: 'add', path: '/volumes/-', value: body }])
    expect(handleMessage).toHaveBeenCalledWith({ type: 'addImage', body }, expect.anything())
  })

  it('applyPatch rejects unsupported ops in v1 (facade-first)', async () => {
    const client = createViewerClient(makeAppProps())
    await expect(
      client.applyPatch([{ op: 'replace', path: '/opts/sliceType', value: 1 }]),
    ).rejects.toThrow(/not supported in v1/)
  })

  it('getDocument serializes the selected canvas via nv.json()', async () => {
    const exported = { title: 't', encodedImageBlobs: [], opts: {} }
    const nvA = { json: vi.fn(() => ({ title: 'A' })) }
    const nvB = { json: vi.fn(() => exported) }
    const client = createViewerClient(makeAppProps([nvA, nvB], [1]))
    const doc = await client.getDocument()
    expect(nvB.json).toHaveBeenCalledTimes(1)
    expect(nvA.json).not.toHaveBeenCalled()
    expect(doc).toBe(exported)
  })

  it('getDocument throws when there is no canvas to export', async () => {
    const client = createViewerClient(makeAppProps([]))
    await expect(client.getDocument()).rejects.toThrow(/no canvas/)
  })

  it('on(ready) fires once; on(documentChanged) fires after applyDocument; dispose unsubscribes', async () => {
    const client = createViewerClient(makeAppProps())
    const ready = vi.fn()
    client.on('ready', ready)
    await flush()
    expect(ready).toHaveBeenCalledTimes(1)

    const changed = vi.fn()
    const sub = client.on('documentChanged', changed)
    await client.applyDocument({ title: 'x' } as never)
    expect(changed).toHaveBeenCalledTimes(1)

    sub.dispose()
    await client.applyDocument({ title: 'y' } as never)
    expect(changed).toHaveBeenCalledTimes(1)
  })

  it('on(locationChanged) bridges the location signal', () => {
    const props = makeAppProps()
    const client = createViewerClient(props)
    const loc = vi.fn()
    client.on('locationChanged', loc)
    props.location.value = '10 20 30 mm'
    expect(loc).toHaveBeenCalledWith('10 20 30 mm')
  })
})
