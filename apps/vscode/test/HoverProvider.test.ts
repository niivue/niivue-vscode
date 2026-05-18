import { describe, expect, it, vi } from 'vitest'
import { LinkHoverProvider } from '../src/HoverProvider'
import { MarkdownString, Position, Range } from './vscode-mock'

/**
 * The provider runs two regexes against the line at the cursor — one for
 * https URLs ending in a supported image extension, one for local paths
 * ending similarly. We exercise both branches across the full supported
 * extension list and on a few negative cases.
 */

/**
 * Build a vscode.TextDocument-shaped stub. `getWordRangeAtPosition` is the
 * only method LinkHoverProvider uses besides `getText`. We simulate it by
 * running the supplied regex against `line` and returning a Range if it
 * matches at all (LinkHoverProvider doesn't actually check the cursor offset
 * — it accepts any match on the line).
 */
function makeDocument(line: string) {
  return {
    getWordRangeAtPosition: vi.fn((_pos: Position, regex: RegExp) => {
      const m = line.match(regex)
      return m ? new Range(new Position(0, m.index ?? 0), new Position(0, (m.index ?? 0) + m[0].length)) : undefined
    }),
    getText: vi.fn((_range: Range) => {
      // The provider only calls getText with the range returned above.
      // Return the matched substring by re-running the relevant regex.
      // For the test stub, the simplest correct behavior: return the whole line.
      // LinkHoverProvider then passes it to Uri.parse / Uri.file which is fine.
      return line
    }),
  }
}

async function tryHover(line: string) {
  const provider = new LinkHoverProvider()
  const doc = makeDocument(line)
  // The position values don't matter — our stub returns the range whenever the
  // line itself matches the regex.
  try {
    return (await provider.provideHover(doc as any, new Position(0, 0), {} as any)) as
      | { contents: MarkdownString[] }
      | undefined
  } catch {
    // The implementation calls `reject()` (no args) when neither pattern matches.
    return undefined
  }
}

describe('LinkHoverProvider — web URLs', () => {
  it.each([
    '.nii.gz',
    '.nii',
    '.npy',
    '.npz',
    '.dcm',
    '.mih',
    '.mif',
    '.nhdr',
    '.nrrd',
    '.mhd',
    '.mha',
    '.mgh',
    '.mgz',
    '.v',
    '.v16',
    '.vmr',
    '.head',
  ])('detects https URL ending in %s', async (ext) => {
    const hover = await tryHover(`see this file https://example.org/data/scan${ext} for details`)
    expect(hover).toBeDefined()
    expect(hover!.contents[0]).toBeInstanceOf(MarkdownString)
    expect(hover!.contents[0].value).toContain('[Show with NiiVue]')
  })

  it('marks the returned MarkdownString as trusted so command links work', async () => {
    const hover = await tryHover('https://example.org/data/scan.nii.gz')
    expect(hover!.contents[0].isTrusted).toBe(true)
  })

  it('detection is case-insensitive on the extension', async () => {
    const hover = await tryHover('https://example.org/SCAN.NII.GZ')
    expect(hover).toBeDefined()
  })

  it('embeds the niiVue.openLink command with the URI as argument', async () => {
    const hover = await tryHover('https://example.org/scan.nii.gz')
    const value = (hover!.contents[0] as MarkdownString).value
    expect(value).toMatch(/command:niiVue\.openLink\?/)
  })
})

describe('LinkHoverProvider — local paths', () => {
  it('detects an absolute Windows-style path ending in a supported extension', async () => {
    const hover = await tryHover('C:\\data\\scan.nii.gz')
    expect(hover).toBeDefined()
  })

  it('detects a relative path ending in a supported extension', async () => {
    const hover = await tryHover('see data/scan.nrrd here')
    expect(hover).toBeDefined()
  })

  it('uses niiVue.openLocal (not openLink) for local paths', async () => {
    const hover = await tryHover('data/scan.nii')
    const value = (hover!.contents[0] as MarkdownString).value
    expect(value).toMatch(/command:niiVue\.openLocal\?/)
  })
})

describe('LinkHoverProvider — negative cases', () => {
  it('returns nothing for plain text', async () => {
    expect(await tryHover('just some text, no link here')).toBeUndefined()
  })

  it('returns nothing for unsupported extensions', async () => {
    expect(await tryHover('https://example.org/data/scan.txt')).toBeUndefined()
    expect(await tryHover('data/file.png')).toBeUndefined()
  })

  it('returns nothing for an empty line', async () => {
    expect(await tryHover('')).toBeUndefined()
  })
})
