import { describe, expect, it, vi } from 'vitest'
import { LinkHoverProvider } from '../src/HoverProvider'
import { MarkdownString, Position, Range, Uri } from './vscode-mock'

/**
 * The provider runs two regexes against the line at the cursor — one for
 * https URLs ending in a supported image extension, one for local paths
 * ending similarly. We exercise both branches across the full supported
 * extension list and on a few negative cases.
 */

/**
 * Build a vscode.TextDocument-shaped stub. `getWordRangeAtPosition` runs the
 * provided regex against the line and returns a Range pointing at the match
 * span; `getText(range)` slices that exact substring. This preserves the
 * real VS Code contract — if the provider passed the wrong range, getText
 * would return the wrong substring and the assertions below would catch it.
 */
function makeDocument(line: string) {
  return {
    getWordRangeAtPosition: vi.fn((_pos: Position, regex: RegExp) => {
      const m = line.match(regex)
      if (!m || m.index === undefined) return undefined
      return new Range(new Position(0, m.index), new Position(0, m.index + m[0].length))
    }),
    getText: vi.fn((range: Range) => line.slice(range.start.character, range.end.character)),
  }
}

/**
 * Extract the args-bearing command URI (the second argument to MarkdownString
 * — the link target inside `[Show with NiiVue](...)`).
 */
function commandUriFrom(hover: { contents: MarkdownString[] }): {
  scheme: string
  command: string
  args: { resourceUri: { scheme: string; path: string } }
} {
  const value = hover.contents[0].value
  const linkMatch = value.match(/\(([^)]+)\)/)
  expect(linkMatch).toBeTruthy()
  const uriString = linkMatch![1]
  const parsed = Uri.parse(uriString)
  // command-scheme URIs serialize as `command:<commandId>?<encoded-args>`
  expect(parsed.scheme).toBe('command')
  const args = JSON.parse(decodeURIComponent(parsed.query)) as Array<{
    resourceUri: { scheme: string; path: string }
  }>
  return { scheme: parsed.scheme, command: parsed.path, args: args[0] }
}

async function tryHover(line: string) {
  const provider = new LinkHoverProvider()
  const doc = makeDocument(line)
  try {
    return (await provider.provideHover(doc as any, new Position(0, 0), {} as any)) as {
      contents: MarkdownString[]
    }
  } catch (err) {
    // The implementation signals "no hover" via `reject()` with no arg, which
    // rejects the promise with `undefined`. Any other thrown value is an
    // unexpected error and must fail the test, not be silently swallowed.
    if (err === undefined) return undefined
    throw err
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

  it('embeds niiVue.openLink as the command and only the matched URL in args', async () => {
    const line = 'see this file https://example.org/data/scan.nii.gz here'
    const hover = await tryHover(line)
    const { scheme, command, args } = commandUriFrom(hover!)
    expect(scheme).toBe('command')
    expect(command).toBe('niiVue.openLink')
    // resourceUri should be the URL itself, not surrounding context. Our mock
    // Uri.parse extracts scheme + path; checking those rules out the
    // "stub returned the full line" trap.
    expect(args.resourceUri.scheme).toBe('https')
    expect(args.resourceUri.path).toContain('/data/scan.nii.gz')
    // And critically, the args must NOT contain the surrounding text.
    const argsBlob = decodeURIComponent(Uri.parse(hover!.contents[0].value.match(/\(([^)]+)\)/)![1]).query)
    expect(argsBlob).not.toContain('see this file')
    expect(argsBlob).not.toContain('here')
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
    const { command } = commandUriFrom(hover!)
    expect(command).toBe('niiVue.openLocal')
  })

  it('puts only the matched path into args (not surrounding text)', async () => {
    const hover = await tryHover('see data/scan.nrrd here')
    const argsBlob = decodeURIComponent(Uri.parse(hover!.contents[0].value.match(/\(([^)]+)\)/)![1]).query)
    expect(argsBlob).toContain('scan.nrrd')
    expect(argsBlob).not.toContain('see ')
    expect(argsBlob).not.toContain(' here')
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
