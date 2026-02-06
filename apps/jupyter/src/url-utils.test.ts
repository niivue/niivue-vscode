import { describe, expect, it } from 'vitest'
import { getContentsUrl, getFileUrl } from './url-utils'

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
