/// <reference types="./types/dcm2niix" />
/// <reference types="./types/virtual-modules" />
import { Dcm2niix } from '@niivue/dcm2niix'
import workerUrl from 'dcm2niix-worker'

export interface NamedBuffer {
  name: string
  data: ArrayBuffer
}

// Resolves once the dcm2niix worker has compiled its WASM module. The worker
// reports startup failures as an `error` message rather than an error event,
// so both reject; otherwise a failed start would leave the load hanging.
function whenReady(worker: Worker): Promise<void> {
  return new Promise((resolve, reject) => {
    worker.onmessage = (event: MessageEvent) => {
      if (event.data?.type === 'ready') {
        resolve()
      } else if (event.data?.type === 'error') {
        reject(new Error(`dcm2niix failed to start: ${event.data.message ?? 'unknown error'}`))
      }
    }
    worker.onerror = (error: ErrorEvent) => {
      reject(new Error(`Worker failed to load: ${error.message || 'Unknown error'}`))
    }
  })
}

// Convert DICOM files to NIfTI with dcm2niix. Each call runs in its own worker
// (built from the inlined `dcm2niix-worker` module, so no host has to serve a
// worker file) and terminates it once the results are read, success or not.
export async function dicomToNifti(files: NamedBuffer[]): Promise<NamedBuffer[]> {
  const worker = new Worker(workerUrl, { type: 'module' })
  try {
    await whenReady(worker)
    const dcm2niix = new Dcm2niix()
    dcm2niix.worker = worker
    const input = files.map(
      (file) => new File([file.data], file.name, { type: 'application/octet-stream' }),
    )
    const converted = await dcm2niix.input(input).run()
    const nifti = converted.filter(
      (file) => file.name.endsWith('.nii') || file.name.endsWith('.nii.gz'),
    )
    return await Promise.all(
      nifti.map(async (file) => ({ name: file.name, data: await file.arrayBuffer() })),
    )
  } finally {
    worker.terminate()
  }
}
