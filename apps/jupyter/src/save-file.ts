/** A file the viewer asks its host to save (e.g. a screenshot), bytes in base64. */
export interface SaveFileBody {
  filename: string
  mimeType: string
  data: string
}

export function isSaveFileBody(body: unknown): body is SaveFileBody {
  const b = body as Partial<SaveFileBody> | null
  return (
    typeof b === 'object' &&
    b !== null &&
    typeof b.filename === 'string' &&
    typeof b.mimeType === 'string' &&
    typeof b.data === 'string'
  )
}

/**
 * Download a file sent by the viewer iframe. The viewer sees the mocked
 * `window.vscode` and posts files instead of downloading them itself, so the
 * download starts from the JupyterLab page. Returns false for a malformed body.
 */
export function downloadFile(body: unknown, doc: Document = document): boolean {
  if (!isSaveFileBody(body)) {
    return false
  }
  let binary: string
  try {
    binary = atob(body.data)
  } catch {
    return false
  }
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  const url = URL.createObjectURL(new Blob([bytes], { type: body.mimeType }))
  const link = doc.createElement('a')
  link.href = url
  link.download = body.filename
  doc.body.appendChild(link)
  link.click()
  link.remove()
  // Revoke on the next tick so the click has been dispatched.
  setTimeout(() => URL.revokeObjectURL(url), 0)
  return true
}
