import { vi } from 'vitest'

// Define localStorage and sessionStorage mocks
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}

const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}

// Mock window object for SSR safety checks
Object.defineProperty(global, 'window', {
  value: {
    localStorage: localStorageMock,
    sessionStorage: sessionStorageMock,
  },
  writable: true,
})

// Mock console to avoid test noise
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
}
