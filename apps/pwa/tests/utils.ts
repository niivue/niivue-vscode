import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const BASE_URL = 'http://localhost:4000/'

// Helper to load files from local test assets during tests
function loadLocalTestFile(filePath: string): ArrayBuffer {
  const fullPath = path.join(__dirname, '..', filePath)
  const buffer = fs.readFileSync(fullPath)
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
}

export async function loadTestImage(page) {
  // Load local test DICOM file exactly like Dicom.spec.ts does
  const dicomPath = path.join(__dirname, '..', 'test', 'assets', 'enh.dcm')
  const dicomBuffer = fs.readFileSync(dicomPath)
  const dicomArrayBuffer = dicomBuffer.buffer.slice(
    dicomBuffer.byteOffset,
    dicomBuffer.byteOffset + dicomBuffer.byteLength,
  )

  const message = {
    type: 'addImage',
    body: {
      data: Array.from(new Uint8Array(dicomArrayBuffer)),
      uri: 'enh.dcm',
    },
  }

  await page.evaluate((m) => window.postMessage(m, '*'), message)
  // Note: Not waiting for canvas here - let tests decide how to wait
}

export async function load4DTestImage(page) {
  // TODO: Add local 4D test file to test/assets/
  // For now, use the same DICOM file as a placeholder
  const data = loadLocalTestFile('test/assets/enh.dcm')

  const message = {
    type: 'addImage',
    body: {
      data: Array.from(new Uint8Array(data)),
      uri: 'enh.dcm',
    },
  }
  await page.evaluate((m) => window.postMessage(m, '*'), message)
  await page.waitForSelector('canvas', { timeout: 10000 })
}

export async function loadOverlay(page) {
  // Use local DICOM file as overlay
  const data = loadLocalTestFile('test/assets/enh.dcm')

  const message = {
    type: 'overlay',
    body: {
      data: Array.from(new Uint8Array(data)),
      uri: 'enh.dcm',
      index: 0,
    },
  }
  await page.evaluate((m) => window.postMessage(m, '*'), message)
}

export async function loadTestSurfImage(page) {
  // TODO: Mesh tests require external URLs or local mesh files
  // Skipping for now - need to add mesh test assets
  throw new Error('Mesh test assets not yet available locally')
}

export async function loadTestSurfOverlay(page, file_type) {
  // TODO: Mesh overlay tests require external URLs or local mesh files
  // Skipping for now - need to add mesh test assets
  throw new Error('Mesh overlay test assets not yet available locally')
}

export function listenForDebugMessage(page) {
  const message = page.evaluate(() => {
    return new Promise((resolve) => {
      window.addEventListener('message', (event) => {
        if (event.data?.type == 'debugAnswer') {
          resolve(event.data.body)
        }
      })
    })
  })
  return message
}
