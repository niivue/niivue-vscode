import { Page } from '@playwright/test'

export const BASE_URL = 'http://localhost:4000/'

export async function waitForImageLoad(page: Page, timeout = 10000) {
  // Snapshot the current loaded count before we start waiting.
  // NiiVueCanvas increments window.__niivue.loadedCount after each successful
  // volume load. This is more reliable than waiting for <canvas> to appear,
  // because the canvas element is inserted as soon as addImage is processed
  // (before the async loadVolume call completes).
  const prevCount = await page.evaluate<number>(
    () => (window as any).__niivue?.loadedCount ?? 0,
  )

  const successCheck = page.waitForFunction(
    (prev: number) => ((window as any).__niivue?.loadedCount ?? 0) > prev,
    prevCount,
    { timeout },
  )

  const failureCheck = page
    .waitForSelector('text=Failed to load image', { timeout })
    .then(() => {
      throw new Error(
        'Image load failed: "Failed to load image" message detected.',
      )
    })
    .catch((e: Error) => {
      if (e.message.includes('Timeout')) {
        return new Promise(() => { })
      }
      throw e
    })

  await Promise.race([successCheck, failureCheck])
}

export async function loadTestImage(page: Page) {
  const testLink = BASE_URL + 'lesion.nii.gz'
  // send a message to the app to load the test image
  const message = {
    type: 'addImage',
    body: {
      data: '',
      uri: testLink,
    },
  }
  await page.evaluate((m) => window.postMessage(m, '*'), message)
  await waitForImageLoad(page)
}

export async function load4DTestImage(page: Page) {
  const testLink = BASE_URL + 'pcasl.nii.gz'
  // send a message to the app to load the test image
  const message = {
    type: 'addImage',
    body: {
      data: '',
      uri: testLink,
    },
  }
  await page.evaluate((m) => window.postMessage(m, '*'), message)
  await waitForImageLoad(page)
}

export async function loadOverlay(page: Page) {
  const testLink = BASE_URL + 'pcasl.nii.gz'
  // send a message to the app to load the test image
  const message = {
    type: 'overlay',
    body: {
      data: '',
      uri: testLink,
      index: 0,
    },
  }
  await page.evaluate((m) => window.postMessage(m, '*'), message)
  await waitForImageLoad(page)
}

export async function loadTestSurfImage(page: Page) {
  const testLink = BASE_URL + 'BrainMesh_ICBM152.lh.mz3'
  // send a message to the app to load the test image
  const message = {
    type: 'addImage',
    body: {
      data: '',
      uri: testLink,
    },
  }
  await page.evaluate((m) => window.postMessage(m, '*'), message)
  await waitForImageLoad(page)
}

export async function loadTestSurfOverlay(page: Page, file_type: string) {
  let testLink

  if (file_type === 'curv') {
    testLink = BASE_URL + 'BrainMesh_ICBM152.lh.curv'
  } else if (file_type === 'other') {
    testLink = BASE_URL + 'BrainMesh_ICBM152.lh.motor.mz3'
  }
  // send a message to the app to load the test image
  const message = {
    type: 'addMeshOverlay',
    body: {
      index: 0,
      data: '',
      uri: String(testLink),
    },
  }
  await page.evaluate((m) => window.postMessage(m, '*'), message)
}

export function listenForDebugMessage(page: Page) {
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
