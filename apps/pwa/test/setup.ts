import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Setup jsdom environment for testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Provide build-time globals that some components expect (fallbacks for tests)
;(window as any).__GIT_REPO_URL__ = process.env.GIT_REPO_URL || 'https://github.com/niivue/niivue-vscode'
;(window as any).__GIT_HASH__ = process.env.GIT_HASH || 'local'
;(window as any).__BUILD_DATE__ = process.env.BUILD_DATE ? Number(process.env.BUILD_DATE) : Date.now()
