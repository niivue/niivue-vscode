/// <reference types="./types/virtual-modules" />
import { Niimath } from '@niivue/niimath'
import type { Operators } from '@niivue/niimath'
import niimathWorkerUrl from 'niimath-worker'
import { parseNiimathCommands } from './niimathParser'

export type { NiimathCommand } from './niimathParser'
export { parseNiimathCommands } from './niimathParser'

// Patch Niimath.prototype.init to use the inlined worker (for VS Code webview compatibility)
Niimath.prototype.init = function () {
  ;(this as any).worker = new Worker(niimathWorkerUrl, { type: 'module' })

  return new Promise((resolve, reject) => {
    if ((this as any).worker) {
      ;(this as any).worker.onmessage = (event: MessageEvent) => {
        if (event.data?.type === 'ready') {
          resolve(true)
        }
      }

      ;(this as any).worker.onerror = (error: ErrorEvent) => {
        reject(new Error(`Worker failed to load: ${error.message || 'Unknown error'}`))
      }
    }
  })
}

let niimathInstance: Niimath | null = null

/**
 * Get or create a singleton Niimath instance.
 * Initializes the WASM worker on first call.
 */
export async function getNiimath(): Promise<Niimath> {
  if (niimathInstance) {
    return niimathInstance
  }
  const nm = new Niimath()
  await nm.init()
  niimathInstance = nm
  return nm
}

/**
 * Run a niimath command string on a File and return the result as a Blob.
 */
export async function runNiimath(file: File, commandStr: string): Promise<Blob> {
  const nm = await getNiimath()
  const commands = parseNiimathCommands(commandStr, nm.operators)
  let processor = nm.image(file)
  for (const cmd of commands) {
    const method = (processor as any)[cmd.op]
    if (typeof method !== 'function') {
      throw new Error(`No method '${cmd.op}' on ImageProcessor`)
    }
    processor = method.apply(processor, cmd.args)
  }
  return processor.run('output.nii')
}

export { Niimath }
export type { Operators }
