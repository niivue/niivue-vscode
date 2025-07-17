# NiiVue PWA Development Guide

## 🚀 Quick Start

```bash
cd niivue
npm install
npm run dev
```

## 📝 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run unit tests |
| `npm run test:coverage` | Run tests with coverage |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run lint` | Lint code |
| `npm run format` | Format code |
| `npm run type-check` | Check TypeScript types |

## 🧪 Testing

### Unit Tests (Vitest)
- Located in `src/**/*.test.{ts,tsx}`
- Uses Testing Library for component testing
- Run with `npm run test`

### E2E Tests (Playwright)
- Located in `tests/**/*.spec.ts`
- Tests real browser interactions
- Run with `npm run test:e2e`

## 🏗️ Project Structure

```
src/
├── components/          # React components
├── hooks/              # Custom hooks
├── utils/              # Utility functions
├── constants/          # App constants
├── types.d.ts          # Type definitions
├── settings.ts         # App settings
├── events.ts           # Event handlers
└── main.tsx           # App entry point
```

## 🔧 Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow ESLint rules
- Use Prettier for formatting
- Prefer functional components
- Use Preact Signals for state management

### Component Guidelines
- Keep components small and focused
- Use TypeScript interfaces for props
- Add proper error boundaries
- Include accessibility attributes

### Testing Guidelines
- Write tests for all components
- Test user interactions
- Mock external dependencies
- Maintain high test coverage

## 🚀 Deployment

The app is automatically deployed to GitHub Pages on push to main branch.

### Manual Deployment
```bash
npm run build
# Deploy the build/ directory to your hosting service
```

## 🔍 Performance

- Uses Vite for fast development builds
- Code splitting for smaller bundles
- Service worker for offline support
- Image optimization
- Tree shaking for smaller bundle size

## 🔐 Security

- CSP headers configured
- Input validation
- Secure defaults
- Regular dependency updates

## 📱 PWA Features

- Service Worker for offline support
- Web App Manifest
- File associations for medical images
- Install prompts
- Background sync (when supported)
