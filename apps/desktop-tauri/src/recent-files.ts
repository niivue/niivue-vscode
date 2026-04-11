/**
 * Recent files store using Tauri's plugin-store.
 *
 * Persists a list of recently-opened file paths to disk so they are
 * available across application restarts.
 */
import { load } from '@tauri-apps/plugin-store'

export interface RecentFileEntry {
  path: string
  name: string
  openedAt: string
}

const STORE_FILE = 'recent-files.json'
const STORE_KEY = 'recentFiles'
const MAX_RECENT_FILES = 20

const STORE_OPTIONS = {
  defaults: { [STORE_KEY]: [] as RecentFileEntry[] },
  autoSave: false as const,
}

/**
 * Load the list of recently-opened files from the Tauri store.
 */
export async function getRecentFiles(): Promise<RecentFileEntry[]> {
  const store = await load(STORE_FILE, STORE_OPTIONS)
  const files = await store.get<RecentFileEntry[]>(STORE_KEY)
  return files ?? []
}

/**
 * Add a file path to the recent files list.
 * Moves duplicates to the top and trims the list to MAX_RECENT_FILES.
 */
export async function addRecentFile(path: string, name: string): Promise<void> {
  const store = await load(STORE_FILE, STORE_OPTIONS)
  const existing = (await store.get<RecentFileEntry[]>(STORE_KEY)) ?? []

  const entry: RecentFileEntry = {
    path,
    name,
    openedAt: new Date().toISOString(),
  }

  // Remove duplicate if present, then prepend
  const filtered = existing.filter((f) => f.path !== path)
  const updated = [entry, ...filtered].slice(0, MAX_RECENT_FILES)

  await store.set(STORE_KEY, updated)
  await store.save()
}

/**
 * Clear the recent files list.
 */
export async function clearRecentFiles(): Promise<void> {
  const store = await load(STORE_FILE, STORE_OPTIONS)
  await store.set(STORE_KEY, [])
  await store.save()
}
