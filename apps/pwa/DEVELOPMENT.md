# PWA Development

This guide covers development setup specific to the PWA application. For general monorepo setup, see the [root DEVELOPMENT.md](../../DEVELOPMENT.md).

## Prerequisites

See root DEVELOPMENT.md for:

- Node.js and pnpm requirements (Node.js ≥18.0.0, pnpm ≥8.0.0)
- Dev container setup (recommended)
- Monorepo tools (Turborepo, pnpm workspaces)

## Quick Start

### Using Dev Container (Recommended)

1. Open repository in VS Code
2. Reopen in container when prompted
3. PWA dev server available on port 4000

### Manual Setup

```bash
# From repository root
pnpm install
pnpm build

# Start PWA dev server
cd apps/pwa
pnpm dev
```

Access at: http://localhost:4000

## Development Workflows

### Standard Development

For regular development without React package changes:

```bash
cd apps/pwa
pnpm dev
```

### Hot Reload Development (React Changes)

For live updates when modifying `@niivue/react`:

```bash
# From repository root
pnpm dev:source
```

This enables hot reload for changes in `packages/niivue-react/src/`.

## Project Structure

```
apps/pwa/
├── src/
│   ├── components/         # Preact components
│   ├── types/             # TypeScript type definitions
│   ├── Pwa.tsx            # Main app component
│   ├── main.tsx           # Application entry point
│   ├── settings.ts        # App configuration
│   └── index.css          # Global styles
├── public/                # Static assets
├── resources/             # App resources and icons
├── tests/                 # E2E tests (Playwright)
├── test/                  # Unit tests (Vitest)
├── vite.config.ts         # Vite configuration
├── vitest.config.ts       # Vitest configuration
├── playwright.config.ts   # Playwright configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── package.json           # Dependencies and scripts
```

## Key Technologies

- **Preact**: 3kB React alternative for optimal performance
- **Vite**: Fast build tool with HMR (Hot Module Replacement)
- **Tailwind CSS**: Utility-first CSS framework
- **Vitest**: Fast unit testing framework
- **Playwright**: E2E testing framework
- **PWA**: Service worker with offline support
- **@niivue/react**: Shared React components (workspace dependency)

## Testing

### Unit Tests (Vitest)

```bash
# Run tests
pnpm test
```

Tests located in: `test/**/*.test.{ts,tsx}`

### E2E Tests (Playwright)

```bash
# Run E2E tests
pnpm test:e2e
```

Tests located in: `tests/**/*.spec.ts`

### CI Checks

Run all checks before committing:

```bash
pnpm ci
```

This runs: lint, type-check, test:coverage, test:e2e

## PWA Features

### PWA Asset Generation

The PWA uses [@vite-pwa/assets-generator](https://vite-pwa-org.netlify.app/assets-generator/) to automatically generate all required icons from a single source image according to modern best practices.

**Source Image**: `public/logo.png` (transparent NiiVue icon)

**Generated Icons**:

- `favicon.ico` - Browser favicon (16x16, 32x32, 48x48)
- `pwa-64x64.png` - PWA icon for small displays
- `pwa-192x192.png` - Standard PWA icon
- `pwa-512x512.png` - High-res PWA icon
- `maskable-icon-512x512.png` - Maskable icon for Android adaptive icons
- `apple-touch-icon-180x180.png` - iOS home screen icon

**Regenerate Icons**:

```bash
pnpm run generate:pwa-assets
```

**Configuration**: `pwa-assets.config.ts`

Icons are automatically generated during the build process. The generated icons in `public/` are excluded from git (except `logo.png`).

### Service Worker

The app uses Workbox for service worker generation. Configuration in `vite.config.ts`:

```typescript
VitePWA({
  registerType: 'prompt',
  includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', '*.png'],
  workbox: {
    maximumFileSizeToCacheInBytes: 3000000,
    globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}'],
    // Runtime caching configuration...
  },
})
```

### Web App Manifest

The PWA manifest defines app metadata, icons, and file associations:

- Name: "NiiVue Medical Image Viewer"
- Display mode: standalone
- File handlers: `.nii`, `.dcm`, `.mha`, etc.

### Offline Support

The service worker caches:

- Application shell (HTML, CSS, JS)
- Static assets (images, icons)
- External resources (with stale-while-revalidate strategy)

## Vite Configuration

### Alias Configuration

For hot reload development, `@niivue/react` points to source:

```typescript
alias: {
  '@niivue/react': resolve(__dirname, '../../packages/niivue-react/src'),
}
```

### Development Server

```typescript
server: {
  host: '0.0.0.0',    // Allow external connections
  port: 4000,          // Dev server port
  cors: true,          // Enable CORS
  watch: {
    ignored: ['!../../packages/niivue-react/src/**'],
    usePolling: true,  // Cross-platform compatibility
  }
}
```

### Build Configuration

- Output directory: `build/`
- Base path: `/niivue-vscode/` (for GitHub Pages)
- Target: `esnext`
- Minification: terser
- Source maps: enabled
- Code splitting: vendor chunk (preact, signals)

## Deployment

### GitHub Pages

The app is automatically deployed to GitHub Pages:

- URL: https://niivue.github.io/niivue-vscode/
- Trigger: Push to main branch
- Base path: `/niivue-vscode/` (configured in vite.config.ts)

## Debugging

### Browser DevTools

1. Open app in browser (http://localhost:4000)
2. Open DevTools (F12)
3. Use React DevTools extension for component inspection

### VS Code Debugging

Launch configurations available for debugging the dev server.

### Service Worker Debugging

1. Open DevTools → Application → Service Workers
2. Check registration status
3. View cached resources in Cache Storage
4. Test offline mode by checking "Offline"

## Code Style

### TypeScript

- Use TypeScript for all new code
- Prefer interfaces over types
- Use strict mode settings
- Export types explicitly

### Components

- Use functional components
- Use Preact Signals for state
- Keep components small and focused
- Add proper TypeScript types for props

### Styling

- Use Tailwind CSS utility classes

## Resources

- [Vite Documentation](https://vitejs.dev/)
- [Preact Documentation](https://preactjs.com/)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Root Development Guide](../../DEVELOPMENT.md)
