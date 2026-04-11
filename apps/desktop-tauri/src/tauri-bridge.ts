/**
 * Tauri bridge for native file system access.
 *
 * When running inside Tauri, file I/O goes through Rust commands.
 * When running in a browser (e.g. `vite dev` without Tauri), the bridge
 * falls back to the browser File API via drag-and-drop or file picker.
 */
import { invoke } from '@tauri-apps/api/core'

/** Metadata returned by the Rust `get_file_info` command. */
export interface FileInfo {
  path: string
  name: string
  size: number
}

/** Whether we are running inside a Tauri webview. */
export function isTauri(): boolean {
  return '__TAURI_INTERNALS__' in window
}

/**
 * Read a local file and return its raw bytes as a Uint8Array.
 * Uses the Rust `read_file_bytes` command for zero-copy filesystem access.
 */
export async function readFileBytes(path: string): Promise<Uint8Array> {
  const bytes: number[] = await invoke('read_file_bytes', { path })
  return new Uint8Array(bytes)
}

/**
 * Get metadata about a file without reading its contents.
 */
export async function getFileInfo(path: string): Promise<FileInfo> {
  return invoke<FileInfo>('get_file_info', { path })
}

/**
 * List files in a directory, optionally filtered by medical imaging extensions.
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
