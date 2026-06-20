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
  it('applyDocument posts a loadDocument message carrying the document bytes', async () => {
    const client = createViewerClient(makeAppProps())
    // v1: the document is the opaque .nvd CBOR byte payload (a Uint8Array), not a
    // JSON object; the facade uses a generic name (there is no title to read).
    const doc = new Uint8Array([1, 2, 3, 4])
    await client.applyDocument(doc as never)
    expect(handleMessage).toHaveBeenCalledWith(
      { type: 'loadDocument', body: { document: doc, name: 'document.nvd' } },
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

  it('getDocument serializes the selected canvas via nv.serializeDocument()', async () => {
    // v1: getDocument returns the CBOR .nvd bytes from serializeDocument().
    const exported = new Uint8Array([9, 8, 7])
    const nvA = { serializeDocument: vi.fn(() => new Uint8Array([0])) }
    const nvB = { serializeDocument: vi.fn(() => exported) }
    const client = createViewerClient(makeAppProps([nvA, nvB], [1]))
    const doc = await client.getDocument()
    expect(nvB.serializeDocument).toHaveBeenCalledTimes(1)
    expect(nvA.serializeDocument).not.toHaveBeenCalled()
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
