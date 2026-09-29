import fs from 'fs'
import path from 'path'

const distDir = path.resolve(__dirname, '../node_modules/@niivue/dcm2niix/dist')

// Throws unless `search` occurs exactly once, so an upstream change to the
// worker fails the build instead of shipping a worker that never gets ready.
function replaceOnce(source: string, search: string, replacement: string): string {
  const count = source.split(search).length - 1
  if (count !== 1) {
    throw new Error(
      `dcm2niix-worker: expected one ${JSON.stringify(search)} in @niivue/dcm2niix/dist/worker.jpeg.js, found ${count}`,
    )
  }
  return source.replace(search, () => replacement)
}

/**
 * Source of the `dcm2niix-worker` virtual module that src/dicom.ts imports.
 *
 * Inlines the dcm2niix worker, its Emscripten glue and the WASM binary into one
 * Blob URL, so no host has to serve or fetch a separate worker or .wasm file.
 * It uses the `.jpeg` build, the one the package itself loads by default:
 * the plain build lacks OpenJPEG and CharLS and cannot decode JPEG 2000 or
 * JPEG-LS compressed DICOM.
 * The binary is passed to the module as `wasmBinary`; `locateFile` keeps the
 * glue from evaluating `new URL('dcm2niix.jpeg.wasm', import.meta.url)`, which
 * throws when import.meta.url is a blob: URL.
 */
export function dcm2niixWorkerModule(): string {
  const worker = fs.readFileSync(path.join(distDir, 'worker.jpeg.js'), 'utf8')
  const glue = fs.readFileSync(path.join(distDir, 'dcm2niix.jpeg.js'), 'utf8')
  const wasmBase64 = fs.readFileSync(path.join(distDir, 'dcm2niix.jpeg.wasm')).toString('base64')

  const wasmBinary = `(() => {
    const bin = atob(${JSON.stringify(wasmBase64)});
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  })()`
  const moduleArg = `{ locateFile: (file) => file, wasmBinary: ${wasmBinary} }`

  const selfContainedWorker = replaceOnce(
    replaceOnce(worker, 'Module().then(', `Module(${moduleArg}).then(`),
    `import Module from './dcm2niix.jpeg.js';`,
    glue,
  )

  return `
    const workerCode = ${JSON.stringify(selfContainedWorker)};
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    export default URL.createObjectURL(blob);
  `
}
