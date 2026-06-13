import { expect, test } from './fixtures'
import { BASE_URL } from './utils'

// Streamlit uses the same handleMessage path; it forwards args.paired_data
// onto the addImage body as pairedData. We verify the underlying message
// shape works via PWA, since it shares the niivue-react bus.
test('probe: addImage with body.pairedData renders MHD pair (Streamlit shape)', async ({
  page,
}) => {
  await page.goto(BASE_URL)
  await page.waitForLoadState('networkidle')

  await page.evaluate(async (base) => {
    const [mhdResp, rawResp] = await Promise.all([
      fetch(base + 'sphere.mhd'),
      fetch(base + 'sphere.raw'),
    ])
    const mhdBuf = await mhdResp.arrayBuffer()
    const rawBuf = await rawResp.arrayBuffer()
    window.postMessage(
      {
        type: 'addImage',
        body: {
          data: mhdBuf,
          pairedData: rawBuf,
          uri: 'sphere.mhd',
        },
      },
      '*',
    )
  }, BASE_URL)

  await page.waitForFunction(() => ((window as any).__niivue?.loadedCount ?? 0) > 0, {
    timeout: 15000,
  })

  const bodyText = await page.evaluate(() => (document.body.innerText || '').slice(0, 500))
  expect(bodyText).toContain('64 x 64 x 64')
  expect(bodyText).toContain('32 x 32 x 32')
  expect(bodyText).toMatch(/VAL\s+255/)
})
