import { expect, test } from './fixtures'
import { BASE_URL } from './utils'

test.describe('Loading meshes', () => {
  test.skip('loads a test surface', async ({ page }) => {
    // TODO: This test requires valid mesh files
    // The mock MZ3 file in fixtures.ts is too minimal to pass NiiVue's parser
    // Need to either:
    // 1. Create a valid minimal MZ3 mesh file
    // 2. Add real mesh test assets to test/assets/
    // 3. Generate programmatically valid mesh data
    // Skipping for now as mesh tests require proper binary mesh format
  })

  test.skip('loads a test surface and overlay', async ({ page }) => {
    // TODO: Same as above - requires valid mesh files
    // Skipping until proper mesh test assets are added
  })
})
