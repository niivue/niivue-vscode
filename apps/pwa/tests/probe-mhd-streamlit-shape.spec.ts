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

  // The MHD header parses with the right dimensions (proves the .mhd half of the
  // pair was delivered and read).
  const bodyText = await page.evaluate(() => (document.body.innerText || '').slice(0, 500))
  expect(bodyText).toContain('64 x 64 x 64')

  // Verify the detached .raw voxels actually loaded into the volume. We check the
  // decoded image directly rather than the crosshair POS/VAL readout: niivue v1
  // computes a null x-axis affine for a transform-less MHD (sphere.mhd has only
  // ElementSpacing), so vox<->mm - and thus the POS/VAL readout - is NaN. That is
  // an upstream niivue limitation, not the pairedData plumbing this probe covers.
  const vol = await page.evaluate(() => {
    const v = (window as any).appProps?.nvArray?.value?.[0]?.volumes?.[0]
    return { imgLen: v?.img?.length ?? 0, globalMax: v?.globalMax ?? 0 }
  })
  expect(vol.imgLen).toBe(64 * 64 * 64)
  expect(vol.globalMax).toBe(255)
})
