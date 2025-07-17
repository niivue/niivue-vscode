export const BASE_URL = 'http://localhost:4000/'

export async function loadTestImage(page) {
  const testLink = 'https://niivue.github.io/niivue-demo-images/mni152.nii.gz'
  // send a message to the app to load the test image
  const message = {
    type: 'addImage',
    body: {
      data: '',
      uri: testLink,
    },
  }
  await page.evaluate((m) => window.postMessage(m, '*'), message)
}

export async function loadOverlay(page) {
  const testLink = 'https://niivue.github.io/niivue-demo-images/mni152.nii.gz'
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
}

export async function loadTestSurfImage(page) {
  const testLink = 'https://niivue.github.io/niivue/images/BrainMesh_ICBM152.lh.mz3'
  // send a message to the app to load the test image
  const message = {
    type: 'addImage',
    body: {
      data: '',
      uri: testLink,
    },
  }
  await page.evaluate((m) => window.postMessage(m, '*'), message)
}

export async function loadTestSurfOverlay(page, file_type) {
  let testLink

  if (file_type === 'curv') {
    testLink = 'https://niivue.github.io/niivue/images/BrainMesh_ICBM152.lh.curv'
  } else if (file_type === 'other') {
    testLink = 'https://niivue.github.io/niivue/images/BrainMesh_ICBM152.lh.motor.mz3'
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

export function listenForDebugMessage(page) {
  const message = page.evaluate(() => {
    return new Promise((resolve) => {
      window.addEventListener('message', (event) => {
        if (event.data?.type == 'debugAnswer') resolve(event.data.body)
      })
    })
  })
  return message
}
