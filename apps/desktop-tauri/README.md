# NiiVue Desktop

A standalone desktop application for viewing medical images (NIfTI, DICOM, and more), built with [Tauri](https://tauri.app/) and the shared `@niivue/react` component library.

## Features

- **Native file access** — Load images directly from your filesystem without CORS restrictions
- **High-performance WebGL2** — Powered by the NiiVue rendering engine
- **Recent files** — Quickly re-open previously viewed images
- **Cross-platform** — Runs on Linux, macOS, and Windows
- **Data privacy** — All processing happens locally; no data leaves your machine

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) 8+
- [Rust](https://rustup.rs/) (latest stable)
- Platform-specific dependencies:
  - **Linux**: `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, `librsvg2-dev`, `patchelf`
  - **macOS**: Xcode Command Line Tools
  - **Windows**: Microsoft Edge WebView2 (usually pre-installed on Windows 10/11)

## Development

```bash
# From the monorepo root
pnpm install

# Run in development mode (starts Vite dev server + Tauri window)
pnpm --filter @niivue/desktop dev

# Or from this directory
pnpm dev
```

## Building

```bash
# Build for your current platform
pnpm --filter @niivue/desktop build

# The built application will be in src-tauri/target/release/bundle/
```

## Testing

```bash
# Run unit tests (Vitest)
pnpm --filter @niivue/desktop test

# Run Rust tests
cd src-tauri && cargo test
```

## Architecture

```
apps/desktop-tauri/
├── src/                    # TypeScript frontend
│   ├── main.tsx           # Entry point
│   ├── tauri-bridge.ts    # Tauri IPC bridge for file I/O
│   ├── recent-files.ts    # Recent files state management
│   ├── settings.ts        # App settings
│   └── components/
│       ├── DesktopApp.tsx       # Main app wrapper
│       └── DesktopHomeScreen.tsx # Home screen with file picker
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── main.rs        # Entry point
│   │   └── lib.rs         # Commands & business logic
│   ├── Cargo.toml         # Rust dependencies
│   ├── tauri.conf.json    # Tauri configuration
│   └── capabilities/      # Permission capabilities
├── test/                   # Vitest unit tests
├── index.html             # HTML entry point
├── vite.config.ts         # Vite configuration
└── package.json           # Node.js package config
```

The frontend reuses `@niivue/react` components (Menu, Container, ImageDrop, etc.) and adds a Tauri-specific bridge layer that reads files from the local filesystem via Rust commands.
