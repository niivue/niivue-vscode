# Development Guide - NiiVue VS Code Extension

This guide covers VS Code extension-specific development. For general monorepo setup and workflows, see the [root DEVELOPMENT.md](../../DEVELOPMENT.md).

## Quick Start

### Using Dev Container (Recommended)

The easiest way to get started:

1. Open this repository in VS Code
2. Click "Reopen in Container" when prompted
3. All dependencies are automatically installed

See [root DEVELOPMENT.md](../../DEVELOPMENT.md#dev-container-setup-recommended) for details.

### Manual Setup

```bash
# From repository root
pnpm install
pnpm build
```

## VS Code Extension Development

### Watch Mode

Start development with live reload:

```bash
# From repository root
pnpm dev:vscode
```

**What it does:**
- Watches extension code (`apps/vscode/src/`) and React components (`packages/niivue-react/src/`)
- Auto-rebuilds on file changes (2-5 seconds, optimized for dev)
- Auto-syncs built files to `apps/vscode/niivue/`
- Press `Ctrl+R` in Extension Development Host to reload changes

**Optimizations:**
- Skips `.d.ts` generation and minification in dev mode
- Uses polling for file watching (reliable in dev containers/remote filesystems)

### Debugging in VS Code

1. **Start watch mode**: Run `pnpm dev:vscode` (see above)
2. **Press `F5`** to launch the Extension Development Host
3. A new VS Code window opens with the extension loaded
4. Open a neuroimaging file (e.g., `.nii`, `.nii.gz`) to test
5. **See your changes:**
   - Make changes to `.ts` or `.tsx` files
   - Wait for the build to complete (watch console output)
   - Press `Ctrl+R` (or `Cmd+R`) in the Extension Development Host window
   - Your changes will be reflected!

### Debugging Tips

- **Web-based development**: New features implemented in `packages/niivue-react` can be debugged with hot reload from the `apps/pwa` project.
- **WebView debugging**: Run command (ctrl+shift+p): `Developer: Open Webview Developer Tools`
- **Faster iteration**: For UI-heavy work, develop in the PWA app (`apps/pwa`) with instant HMR, then test in VS Code

## Project Structure

```
apps/vscode/
├── src/
│   ├── extension.ts          # Extension entry point
│   ├── niivueProvider.ts     # Custom editor provider
│   └── ...
├── niivue/                    # Built @niivue/react assets
├── package.json               # Extension manifest
└── tsconfig.json             # TypeScript configuration
```

## Dependencies

### @niivue/react Package

The extension depends on the shared React components package:

```bash
# Build React package (required before building extension)
pnpm --filter @niivue/react build

# Watch React package for changes
pnpm --filter @niivue/react dev
```

The built React assets are copied to `apps/vscode/niivue/` during the VS Code build process.

### Build Target

The React package is built specifically for VS Code:

```bash
BUILD_TARGET=vscode pnpm --filter @niivue/react build
```

This configures the React app for WebView embedding without PWA features.

## Testing

### Manual Testing

1. Start the extension in debug mode (`F5`)
2. Test various file formats:
   - `mni152.nii.gz` - NIfTI format
   - `BrainMesh_ICBM152.lh.mz3` - Mesh format  
   - `enh.dcm` - DICOM format
3. Test features:
   - Single file viewing
   - Compare mode (select multiple files → right-click → "NiiVue: Compare")
   - Overlay functionality
   - Keyboard shortcuts

### Automated Tests

```bash
# Run tests for VS Code extension
pnpm --filter @niivue/vscode test
```

## Publishing

### Setup

```bash
# Install publishing tools
npm install -g @vscode/vsce ovsx
```

Get access tokens:
- [VS Code Marketplace](https://marketplace.visualstudio.com/manage) - Create PAT with Marketplace (publish) scope
- [Open VSX Registry](https://open-vsx.org/) - Create access token

### Package and Publish

```bash
cd apps/vscode

# Update version in vscode package.json

# Build the extension
pnpm build

# Package as .vsix
vsce package

# Publish to VS Code Marketplace
vsce publish --packagePath niivue-x.y.z.vsix

# Publish to Open VSX Registry
pnpm ovsx publish niivue-x.y.z.vsix --pat <your-token>
```

#### Pre-release Versions

```bash
vsce publish --pre-release
```

## Marketplace-Specific Requirements

### VS Code Marketplace

- Extension must be packaged with `vsce package`
- Must have valid publisher ID in `package.json`
- Requires Personal Access Token with Marketplace (publish) scope

### Open VSX Registry

- Alternative marketplace for VS Code extensions
- Required for VSCodium and other VS Code forks
- Compatible with same `.vsix` file format

## Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [VS Code WebView API](https://code.visualstudio.com/api/extension-guides/webview)
- [Custom Editor Guide](https://code.visualstudio.com/api/extension-guides/custom-editors)
- [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [Open VSX Registry](https://open-vsx.org/)
- [Root Development Guide](../../DEVELOPMENT.md)
