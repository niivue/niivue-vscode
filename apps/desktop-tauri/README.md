# NiiVue Desktop

A standalone desktop application for viewing medical images (NIfTI, DICOM, and more), built with [Tauri](https://tauri.app/) and the shared `@niivue/react` component library.

## Features

- **Native file access** - Load images directly from your filesystem without CORS restrictions
- **High-performance WebGL2** - Powered by the NiiVue rendering engine
- **Cross-platform** - Linux, macOS, and Windows
- **Data privacy** - All processing happens locally; no data leaves your machine

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) 8+
- [Rust](https://rustup.rs/) (latest stable)
- Platform-specific:
  - **Linux**: `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, `librsvg2-dev`, `patchelf`
  - **macOS**: Xcode Command Line Tools
  - **Windows**: Microsoft Edge WebView2 (preinstalled on Windows 10/11)

## Development

```bash
# From the monorepo root
pnpm install

# Run in development mode (Vite dev server + Tauri window)
pnpm --filter @niivue/desktop dev
```

## Building

```bash
pnpm --filter @niivue/desktop build
# Output: src-tauri/target/release/bundle/
```

## Testing

```bash
# TypeScript unit tests
pnpm --filter @niivue/desktop test

# Rust unit tests
cd apps/desktop-tauri/src-tauri && cargo test
```

## Security model

The renderer cannot read arbitrary files from the host. Every path that crosses the IPC boundary must be authorised first:

1. The user picks a file via the native dialog plugin (or drag-drops it into the window).
2. The frontend calls `registerOpenedPath` to authorise that path on the Rust side.
3. Subsequent `readFileBytes` / `getFileInfo` calls accept only authorised paths.
4. `listDirectory` is the only command that grows the allowlist server-side, for paths it has just surfaced.

The CSP is tight (no `unsafe-eval`); the only IPC-callable Rust commands are `register_opened_path`, `read_file_bytes`, `get_file_info`, and `list_directory`, plus the Tauri-provided `dialog` and `store` plugins.

## Architecture

```
apps/desktop-tauri/
|-- src/                    # TypeScript frontend
|   |-- main.tsx           # Entry point
|   |-- tauri-bridge.ts    # Tauri IPC bridge for file I/O
|   |-- recent-files.ts    # Recent files persistence
|   `-- components/
|       |-- DesktopApp.tsx       # Main app wrapper
|       `-- DesktopHomeScreen.tsx # Home screen with file picker
|-- src-tauri/              # Rust backend
|   |-- src/
|   |   |-- main.rs        # Entry point
|   |   `-- lib.rs         # Commands & business logic
|   |-- Cargo.toml         # Rust dependencies
|   |-- tauri.conf.json    # Tauri configuration
|   `-- capabilities/      # Permission capabilities
|-- test/                   # Vitest unit tests
|-- index.html             # HTML entry point
|-- vite.config.ts         # Vite configuration
`-- package.json           # Node.js package config
```

## Known limitations / planned work

- **OS file association / CLI args** are not yet wired. Double-clicking a `.nii` file in Finder/Explorer or running `niivue-desktop /path/to/scan.nii` does not currently open the file in this app. Needs `tauri-plugin-single-instance` + `tauri-plugin-cli` integration.
- **Recent files** are persisted to disk but there is no UI surface to re-open them yet. The plumbing is in place; the home-screen list is a follow-up.

Both items are tracked as follow-up issues.
