/**
 * Tauri bridge for native file system access.
 *
 * When running inside Tauri, file I/O goes through Rust commands. The byte
 * payload from `read_file_bytes` uses Tauri's binary IPC channel
 * (`tauri::ipc::Response`), so a multi-hundred-MB NIfTI volume is delivered
 * to the renderer as an `ArrayBuffer` with no JSON detour.
 *
 * For path-scope safety, every path that becomes available to the renderer
 * (whether via the dialog plugin or `list_directory`) must be registered
 * with Rust via `registerOpenedPath` before it can be read. The dialog
 * plugin returns user-confirmed paths; `list_directory` registers its own
 * entries server-side. The renderer cannot turn this bridge into an
 * arbitrary-file-read primitive against the host filesystem.
 */
import { invoke, isTauri as tauriIsTauri } from '@tauri-apps/api/core'

/** Metadata returned by the Rust `get_file_info` command. */
export interface FileInfo {
  path: string
  name: string
  size: number
}

/** Whether we are running inside a Tauri webview. */
export function isTauri(): boolean {
  return tauriIsTauri()
}

/**
 * Authorise a path for subsequent `readFileBytes` / `getFileInfo` calls.
 * Paths returned by the native file dialog should be registered before
 * reading. `listDirectory` registers its returned entries server-side, so
 * callers do not need to register them again.
 */
export async function registerOpenedPath(path: string): Promise<void> {
  await invoke('register_opened_path', { path })
}

/**
 * Read a local file and return its raw bytes as a Uint8Array.
 * The path must have been previously registered via `registerOpenedPath`
 * (or surfaced by `listDirectory`); unregistered paths are rejected.
 */
export async function readFileBytes(path: string): Promise<Uint8Array> {
  const buffer = await invoke<ArrayBuffer>('read_file_bytes', { path })
  return new Uint8Array(buffer)
}

/**
 * Get metadata about a file without reading its contents.
 * The path must already be authorised (see `registerOpenedPath`).
 */
export async function getFileInfo(path: string): Promise<FileInfo> {
  return invoke<FileInfo>('get_file_info', { path })
}

/**
 * List files in a directory, optionally filtered by medical imaging extensions.
 * The directory itself must already be authorised; entries returned here are
 * authorised automatically by the Rust side.
 */
export async function listDirectory(
  path: string,
  extensions?: string[],
): Promise<FileInfo[]> {
  return invoke<FileInfo[]>('list_directory', { path, extensions })
}

/** Common medical imaging file extensions. */
export const MEDICAL_IMAGE_EXTENSIONS = [
  '.nii',
  '.nii.gz',
  '.dcm',
  '.mha',
  '.mhd',
  '.nhdr',
  '.nrrd',
  '.mgh',
  '.mgz',
  '.gii',
  '.mz3',
  '.npy',
  '.npz',
  '.v',
  '.v16',
  '.vmr',
]
