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

/** What saving into the Jupyter workspace needs from JupyterLab. */
export interface WorkspaceSaver {
  /** Ask where to save, starting from a suggested path; null when cancelled. */
  askPath(suggested: string): Promise<string | null>
  /** Whether something exists at the path. */
  exists(path: string): Promise<boolean>
  /** Ask whether an existing file may be replaced. */
  confirmReplace(path: string): Promise<boolean>
  /** Write base64 content as a file. */
  write(path: string, base64: string): Promise<void>
  saved(path: string): void
  failed(path: string, error: unknown): void
}

/** The suggested workspace path for a file: its base name in `folder`. */
export function suggestedSavePath(folder: string, filename: string): string {
  // Only a plain name is accepted; directories come from the user.
  const name = filename.split(/[/\\]/).pop()
  const base = name && !/^\.\.?$/.test(name) ? name : 'untitled'
  const dir = folder.replace(/^\/+|\/+$/g, '')
  return dir ? `${dir}/${base}` : base
}

/**
 * Save a file sent by the viewer iframe into the workspace, suggesting the
 * opened file's folder. The viewer sees the mocked `window.vscode` and posts
 * files instead of downloading them. Returns the path written, or null when
 * the body is malformed, the user cancels or the write fails.
 */
export async function saveToWorkspace(
  body: unknown,
  folder: string,
  saver: WorkspaceSaver,
): Promise<string | null> {
  if (!isSaveFileBody(body)) {
    return null
  }
  try {
    atob(body.data)
  } catch {
    return null
  }
  const path = (await saver.askPath(suggestedSavePath(folder, body.filename)))
    ?.trim()
    .replace(/^\/+/, '')
  if (!path) {
    return null
  }
  try {
    if ((await saver.exists(path)) && !(await saver.confirmReplace(path))) {
      return null
    }
    await saver.write(path, body.data)
    saver.saved(path)
    return path
  } catch (error) {
    saver.failed(path, error)
    return null
  }
}
