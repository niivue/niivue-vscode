import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PageConfig } from '@jupyterlab/coreutils'
import { ServerConnection } from '@jupyterlab/services'
import {
  fetchArrayBuffer,
  fetchJson,
  getContentsUrl,
  getFileUrl,
  getJupyterUrl,
  getMhdPairedRawBasename,
  getMhdPairedRawPath,
} from './url-utils'

describe('URL utilities', () => {
  describe('getFileUrl', () => {
    it('constructs file URL with simple base URL', () => {
      const url = getFileUrl('http://localhost:8888/', 'data/brain.nii.gz')
      expect(url).toBe('http://localhost:8888/files/data/brain.nii.gz')
    })

    it('constructs file URL with JupyterHub prefix', () => {
      // This is the key scenario the fix addresses - JupyterHub prefixes
      const url = getFileUrl('http://hub.example.com/user/johndoe/', 'data/brain.nii.gz')
      expect(url).toBe('http://hub.example.com/user/johndoe/files/data/brain.nii.gz')
    })

    it('handles base URL without trailing slash', () => {
      const url = getFileUrl('http://localhost:8888', 'data/brain.nii.gz')
      expect(url).toBe('http://localhost:8888/files/data/brain.nii.gz')
    })

    it('handles file path with leading slash', () => {
      const url = getFileUrl('http://localhost:8888/', '/data/brain.nii.gz')
      expect(url).toBe('http://localhost:8888/files/data/brain.nii.gz')
    })

    it('encodes special characters in file path', () => {
      const url = getFileUrl('http://localhost:8888/', 'data/my brain scan.nii.gz')
      expect(url).toBe('http://localhost:8888/files/data/my%20brain%20scan.nii.gz')
    })

    it('handles nested JupyterHub paths', () => {
      const url = getFileUrl(
        'http://hub.example.com/jupyter/user/johndoe/lab/',
        'notebooks/analysis.nii',
      )
      expect(url).toBe(
        'http://hub.example.com/jupyter/user/johndoe/lab/files/notebooks/analysis.nii',
      )
    })

    it('handles file path with special characters', () => {
      const url = getFileUrl('http://localhost:8888/', 'data/subject[01]/brain.nii.gz')
      expect(url).toContain('/files/data/')
      expect(url).toContain('brain.nii.gz')
    })
  })

  describe('getContentsUrl', () => {
    it('constructs contents API URL with simple base URL', () => {
      const url = getContentsUrl('http://localhost:8888/', 'data')
      expect(url).toBe('http://localhost:8888/api/contents/data')
    })

    it('constructs contents API URL with JupyterHub prefix', () => {
      // This is the key scenario the fix addresses - JupyterHub prefixes
      const url = getContentsUrl('http://hub.example.com/user/johndoe/', 'data')
      expect(url).toBe('http://hub.example.com/user/johndoe/api/contents/data')
    })

    it('handles base URL without trailing slash', () => {
      const url = getContentsUrl('http://localhost:8888', 'data/dicom')
      expect(url).toBe('http://localhost:8888/api/contents/data/dicom')
    })

    it('handles path with leading slash', () => {
      const url = getContentsUrl('http://localhost:8888/', '/data')
      expect(url).toBe('http://localhost:8888/api/contents/data')
    })

    it('encodes special characters in path', () => {
      const url = getContentsUrl('http://localhost:8888/', 'my data folder')
      expect(url).toBe('http://localhost:8888/api/contents/my%20data%20folder')
    })
  })

  describe('URL construction consistency', () => {
    it('both functions handle JupyterHub paths consistently', () => {
      const baseUrl = 'http://hub.example.com/user/testuser/'
      const path = 'experiments/scan1'

      const fileUrl = getFileUrl(baseUrl, path)
      const contentsUrl = getContentsUrl(baseUrl, path)

      // Both should preserve the JupyterHub prefix
      expect(fileUrl.startsWith('http://hub.example.com/user/testuser/')).toBe(true)
      expect(contentsUrl.startsWith('http://hub.example.com/user/testuser/')).toBe(true)

      // Each should have its specific endpoint
      expect(fileUrl).toContain('/files/')
      expect(contentsUrl).toContain('/api/contents/')
    })

    it('old string concatenation would fail with JupyterHub', () => {
      // Demonstrate why URLExt.join is needed vs simple concatenation
      const baseUrl = 'http://hub.example.com/user/johndoe/'
      const path = 'data/brain.nii.gz'

      // This is what the OLD broken code would produce (conceptually):
      // baseUrl + 'files/' + path = incorrect double paths or missing parts

      // The fix uses URLExt.join which handles this correctly:
      const correctUrl = getFileUrl(baseUrl, path)
      expect(correctUrl).toBe('http://hub.example.com/user/johndoe/files/data/brain.nii.gz')

      // The URL should NOT have issues like:
      expect(correctUrl).not.toContain('//files')
      expect(correctUrl).not.toContain('files/files')
    })
  })
})

describe('getJupyterUrl', () => {
  // getJupyterUrl wraps URLExt.join(PageConfig.getBaseUrl(), path). We
  // install a JupyterHub-style base URL via PageConfig.setOption so the
  // assertions exercise the actual prefix-preserving behavior — an
  // implementation that ignored PageConfig would fail these.
  let savedBaseUrl: string

  beforeEach(() => {
    savedBaseUrl = PageConfig.getOption('baseUrl')
  })

  afterEach(() => {
    PageConfig.setOption('baseUrl', savedBaseUrl)
  })

  it('prepends the configured JupyterHub base URL', () => {
    PageConfig.setOption('baseUrl', 'http://hub.example.com/user/johndoe/')
    expect(getJupyterUrl('api/contents/data')).toBe(
      'http://hub.example.com/user/johndoe/api/contents/data',
    )
  })

  it('joins paths cleanly when the configured base URL lacks a trailing slash', () => {
    PageConfig.setOption('baseUrl', 'http://hub.example.com/user/johndoe')
    expect(getJupyterUrl('api/contents/data')).toBe(
      'http://hub.example.com/user/johndoe/api/contents/data',
    )
  })

  it('normalizes leading slashes against the base URL (no double slashes)', () => {
    PageConfig.setOption('baseUrl', 'http://hub.example.com/user/johndoe/')
    const url = getJupyterUrl('/api/contents/data')
    expect(url).toBe('http://hub.example.com/user/johndoe/api/contents/data')
    expect(url).not.toContain('//api')
  })

  it('falls back to the path under root when no base URL is configured', () => {
    PageConfig.setOption('baseUrl', '')
    expect(getJupyterUrl('api/contents/data')).toMatch(/\/?api\/contents\/data$/)
  })
})

describe('getMhdPairedRawBasename', () => {
  // The function reads an .mhd header as text (via TextDecoder) and looks
  // for the `ElementDataFile = <name>` field, returning the basename or null.
  const enc = (text: string) => new TextEncoder().encode(text).buffer as ArrayBuffer

  it('returns the basename for a plain ElementDataFile entry', () => {
    expect(getMhdPairedRawBasename(enc('ElementDataFile = scan.raw\n'))).toBe('scan.raw')
  })

  it('returns null when ElementDataFile is missing', () => {
    expect(getMhdPairedRawBasename(enc('NDims = 3\nDimSize = 256 256 128\n'))).toBeNull()
  })

  it('returns null when ElementDataFile = LOCAL (data embedded in MHA)', () => {
    expect(getMhdPairedRawBasename(enc('ElementDataFile = LOCAL\n'))).toBeNull()
  })

  it('treats LOCAL case-insensitively', () => {
    expect(getMhdPairedRawBasename(enc('ElementDataFile = local\n'))).toBeNull()
    expect(getMhdPairedRawBasename(enc('ElementDataFile = Local\n'))).toBeNull()
  })

  it('strips quotes around the filename', () => {
    expect(getMhdPairedRawBasename(enc('ElementDataFile = "scan.raw"\n'))).toBe('scan.raw')
    expect(getMhdPairedRawBasename(enc("ElementDataFile = 'scan.raw'\n"))).toBe('scan.raw')
  })

  it('rejects subdirectory components — only returns basename for safety', () => {
    // Forward slashes
    expect(getMhdPairedRawBasename(enc('ElementDataFile = data/scan.raw\n'))).toBe('scan.raw')
    // Backslashes (Windows-style paths inside MHD headers)
    expect(getMhdPairedRawBasename(enc('ElementDataFile = data\\scan.raw\n'))).toBe('scan.raw')
    // Absolute paths
    expect(getMhdPairedRawBasename(enc('ElementDataFile = /etc/passwd\n'))).toBe('passwd')
  })

  it('matches the field key case-insensitively (real MHD files vary)', () => {
    expect(getMhdPairedRawBasename(enc('elementdatafile = scan.raw\n'))).toBe('scan.raw')
    expect(getMhdPairedRawBasename(enc('ELEMENTDATAFILE = scan.raw\n'))).toBe('scan.raw')
  })

  it('finds the field on any line, not just the first', () => {
    const header =
      'NDims = 3\nDimSize = 256 256 128\nElementSpacing = 1 1 1\nElementDataFile = scan.raw\n'
    expect(getMhdPairedRawBasename(enc(header))).toBe('scan.raw')
  })

  it('returns null on an empty buffer', () => {
    expect(getMhdPairedRawBasename(enc(''))).toBeNull()
  })
})

describe('getMhdPairedRawPath', () => {
  it('joins basename next to the mhd file in the same directory', () => {
    expect(getMhdPairedRawPath('data/scans/brain.mhd', 'brain.raw')).toBe('data/scans/brain.raw')
  })

  it('returns just the basename when mhd is at the root (no slash)', () => {
    expect(getMhdPairedRawPath('brain.mhd', 'brain.raw')).toBe('brain.raw')
  })

  it('preserves leading slash on absolute paths', () => {
    expect(getMhdPairedRawPath('/abs/path/scan.mhd', 'scan.raw')).toBe('/abs/path/scan.raw')
  })

  it('does not require the mhd basename and the raw basename to match', () => {
    // MHD ElementDataFile can point to any sibling file name.
    expect(getMhdPairedRawPath('data/scan_v1.mhd', 'data_block.raw')).toBe('data/data_block.raw')
  })
})

// ---------------------------------------------------------------------------
// fetchArrayBuffer / fetchJson — both call ServerConnection.makeRequest, so
// we spy on it. The settings object is opaque to the functions under test;
// we pass `{}` cast through `unknown` to satisfy the type signature.
// ---------------------------------------------------------------------------

afterEach(() => {
  vi.restoreAllMocks()
})

function mockResponse(opts: {
  ok?: boolean
  status?: number
  statusText?: string
  contentType?: string
  body?: ArrayBuffer | string
  url?: string
  textThrows?: boolean
}): Response {
  return {
    ok: opts.ok ?? true,
    status: opts.status ?? 200,
    statusText: opts.statusText ?? 'OK',
    url: opts.url ?? '',
    headers: {
      get: (name: string) =>
        name.toLowerCase() === 'content-type'
          ? (opts.contentType ?? 'application/octet-stream')
          : null,
    },
    arrayBuffer: async () =>
      typeof opts.body === 'string'
        ? new TextEncoder().encode(opts.body).buffer
        : (opts.body ?? new ArrayBuffer(0)),
    text: async () => {
      if (opts.textThrows) {
        throw new Error('reader closed')
      }
      return typeof opts.body === 'string' ? opts.body : ''
    },
    json: async () => (typeof opts.body === 'string' ? JSON.parse(opts.body) : null),
  } as unknown as Response
}

const settings = {} as unknown as ServerConnection.ISettings

describe('fetchArrayBuffer', () => {
  it('returns the ArrayBuffer on a successful 200 response', async () => {
    const expected = new TextEncoder().encode('binary blob').buffer as ArrayBuffer
    vi.spyOn(ServerConnection, 'makeRequest').mockResolvedValue(mockResponse({ body: expected }))
    const result = await fetchArrayBuffer('http://x/y', settings)
    expect(new TextDecoder().decode(result)).toBe('binary blob')
  })

  it('throws with the URL when the network request itself fails', async () => {
    vi.spyOn(ServerConnection, 'makeRequest').mockRejectedValue(new Error('ECONNREFUSED'))
    await expect(fetchArrayBuffer('http://x/y', settings)).rejects.toThrow(
      /Request failed \(http:\/\/x\/y\): ECONNREFUSED/,
    )
  })

  it('throws with status and statusText on a non-OK response', async () => {
    vi.spyOn(ServerConnection, 'makeRequest').mockResolvedValue(
      mockResponse({ ok: false, status: 404, statusText: 'Not Found' }),
    )
    await expect(fetchArrayBuffer('http://x/y', settings)).rejects.toThrow(/HTTP 404 Not Found/)
  })

  it('includes the response body in the error detail (truncated to 300 chars)', async () => {
    const bigDetail = 'X'.repeat(500)
    vi.spyOn(ServerConnection, 'makeRequest').mockResolvedValue(
      mockResponse({ ok: false, status: 500, statusText: 'Server Error', body: bigDetail }),
    )
    await expect(fetchArrayBuffer('http://x/y', settings)).rejects.toThrow(
      /HTTP 500 Server Error; X{300}$/,
    )
  })

  it('tolerates a response.text() that throws (no detail, no rethrow)', async () => {
    vi.spyOn(ServerConnection, 'makeRequest').mockResolvedValue(
      mockResponse({ ok: false, status: 503, statusText: 'Unavailable', textThrows: true }),
    )
    await expect(fetchArrayBuffer('http://x/y', settings)).rejects.toThrow(/HTTP 503 Unavailable$/)
  })

  it('detects HTML responses (likely auth redirect) and includes the final URL', async () => {
    vi.spyOn(ServerConnection, 'makeRequest').mockResolvedValue(
      mockResponse({ contentType: 'text/html; charset=utf-8', url: 'http://hub/login' }),
    )
    await expect(fetchArrayBuffer('http://x/y', settings)).rejects.toThrow(
      /Unexpected HTML response \(likely auth redirect\)\. Final URL: http:\/\/hub\/login/,
    )
  })
})

describe('fetchJson', () => {
  it('returns the parsed JSON on a successful response', async () => {
    vi.spyOn(ServerConnection, 'makeRequest').mockResolvedValue(
      mockResponse({ body: '{"hello": "world"}', contentType: 'application/json' }),
    )
    expect(await fetchJson<{ hello: string }>('http://x/y', settings)).toEqual({ hello: 'world' })
  })

  it('throws with status and statusText on non-OK response', async () => {
    vi.spyOn(ServerConnection, 'makeRequest').mockResolvedValue(
      mockResponse({ ok: false, status: 401, statusText: 'Unauthorized' }),
    )
    await expect(fetchJson('http://x/y', settings)).rejects.toThrow(/HTTP 401 Unauthorized/)
  })

  it('preserves the generic type at the call site', async () => {
    vi.spyOn(ServerConnection, 'makeRequest').mockResolvedValue(
      mockResponse({ body: '{"n": 42}', contentType: 'application/json' }),
    )
    const result = await fetchJson<{ n: number }>('http://x/y', settings)
    expect(result.n).toBe(42)
  })
})
