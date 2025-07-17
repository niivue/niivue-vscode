# JupyterLab NiiVue Extension

A JupyterLab extension for viewing neuroimaging data using NiiVue.

## Install
```bash
npm install
npm run build
```

## Development

### Running the Extension
```bash
npm run build
jupyter labextension develop . --overwrite
jupyter lab
```

### Linting and Formatting
```bash
npm run lint:check    # Check all lint rules
npm run lint:fix      # Auto-fix lint issues
npm run format        # Format code with Prettier
```

## Troubleshooting

### Stylelint Issues

If you encounter stylelint errors related to CSS class naming conventions or formatting, these can often be ignored during development. The current stylelint configuration is set to be permissive for development workflow.

Common stylelint errors you might see:
- `selector-class-pattern`: CSS classes not following JupyterLab's `jp-` prefix convention
- `prettier/prettier`: Minor formatting differences

To temporarily disable stylelint for specific files, add this comment at the top:
```css
/* stylelint-disable */
```

### ESLint Configuration Issues

If you see errors about missing ESLint configurations (e.g., `@typescript-eslint/eslint-plugin/recommended`), install the missing packages:

```bash
npm install --save-dev @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

### Build Issues

If the build fails, try cleaning and rebuilding:
```bash
npm run clean
npm install
npm run build
```
 