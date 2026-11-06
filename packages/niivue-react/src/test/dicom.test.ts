import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { dicomToNifti } from '../dicom'

// Runs dicomToNifti against the real dcm2niix API with a fake worker that
// speaks the dcm2niix worker protocol: `ready` once started, then one reply
// per posted job.

type Startup = { type: 'ready' } | { type: 'error'; message: string }
type Reply = { convertedFiles: File[]; exitCode: number } | { type: 'error'; message: string }

let workers: FakeWorker[] = []
let startup: Startup
let reply: Reply

class FakeWorker {
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: ErrorEvent) => void) | null = null
  terminated = false
  jobs: { fileList: { file: File }[]; cmd: string[] }[] = []

  constructor(
    public url: string,
    public options: WorkerOptions,
  ) {
    workers.push(this)
    queueMicrotask(() => this.emit(startup))
  }

  postMessage(job: { fileList: { file: File }[]; cmd: string[] }) {
    this.jobs.push(job)
    queueMicrotask(() => this.emit(reply))
  }

  terminate() {
    this.terminated = true
  }

  private emit(data: unknown) {
    if (!this.terminated) {
      this.onmessage?.({ data } as MessageEvent)
    }
  }
}

const bytes = (...values: number[]) => new Uint8Array(values).buffer

beforeEach(() => {
  workers = []
  startup = { type: 'ready' }
  reply = { convertedFiles: [], exitCode: 0 }
  vi.stubGlobal('Worker', FakeWorker)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('dicomToNifti', () => {
  it('returns the NIfTI outputs and terminates the worker', async () => {
    reply = {
      convertedFiles: [
        new File([bytes(1, 2, 3)], 'series_1.nii'),
        new File(['{}'], 'series_1.json'),
        new File([bytes(4, 5)], 'series_2.nii.gz'),
      ],
      exitCode: 0,
    }

    const result = await dicomToNifti([{ name: 'IM_0001.dcm', data: bytes(9) }])

    expect(result.map((file) => file.name)).toEqual(['series_1.nii', 'series_2.nii.gz'])
    expect(Array.from(new Uint8Array(result[0].data))).toEqual([1, 2, 3])
    expect(workers).toHaveLength(1)
    expect(workers[0].url).toBe('blob:dcm2niix-worker-stub')
    expect(workers[0].options).toEqual({ type: 'module' })
    expect(workers[0].jobs[0].fileList.map((item) => item.file.name)).toEqual(['IM_0001.dcm'])
    expect(workers[0].terminated).toBe(true)
  })

  it('starts a fresh worker for every conversion', async () => {
    await dicomToNifti([{ name: 'a.dcm', data: bytes(1) }])
    await dicomToNifti([{ name: 'b.dcm', data: bytes(2) }])

    expect(workers).toHaveLength(2)
    expect(workers.every((worker) => worker.terminated)).toBe(true)
  })

  it('terminates the worker when the conversion fails', async () => {
    reply = { convertedFiles: [], exitCode: 2 }

    await expect(dicomToNifti([{ name: 'a.dcm', data: bytes(1) }])).rejects.toThrow('exit code 2')
    expect(workers[0].terminated).toBe(true)
  })

  it('rejects instead of hanging when the worker fails to start', async () => {
    startup = { type: 'error', message: 'out of memory' }

    await expect(dicomToNifti([{ name: 'a.dcm', data: bytes(1) }])).rejects.toThrow(
      'dcm2niix failed to start: out of memory',
    )
    expect(workers[0].jobs).toHaveLength(0)
    expect(workers[0].terminated).toBe(true)
  })
})
