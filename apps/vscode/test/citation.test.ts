import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { CITATION_DOI_URL, CITATION_SHORT } from '../src/citation'

describe('citation', () => {
  it('matches the citation of the viewer', () => {
    const viewer = readFileSync(
      new URL('../../../packages/niivue-react/src/citation.ts', import.meta.url),
      'utf8',
    )

    expect(viewer).toContain(`CITATION_DOI_URL = '${CITATION_DOI_URL}'`)
    expect(viewer).toContain(`CITATION_SHORT = '${CITATION_SHORT}'`)
  })
})
