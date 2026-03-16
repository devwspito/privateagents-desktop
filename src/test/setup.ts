import "@testing-library/jest-dom/vitest"

import { cleanup } from "@testing-library/react"
import { afterEach, beforeEach, vi } from "vitest"

afterEach(() => {
  cleanup()
})

beforeEach(() => {
  vi.clearAllMocks()
})

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

class ResizeObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver

class IntersectionObserverMock {
  readonly root: Element | null = null
  readonly rootMargin: string = ""
  readonly thresholds: ReadonlyArray<number> = []
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn().mockReturnValue([])
}

global.IntersectionObserver =
  IntersectionObserverMock as unknown as typeof IntersectionObserver

class MockPointerEvents {
  setPointerCapture = vi.fn()
  releasePointerCapture = vi.fn()
  hasPointerCapture = vi.fn().mockReturnValue(false)
}

Element.prototype.setPointerCapture =
  MockPointerEvents.prototype.setPointerCapture
Element.prototype.releasePointerCapture =
  MockPointerEvents.prototype.releasePointerCapture
Element.prototype.hasPointerCapture =
  MockPointerEvents.prototype.hasPointerCapture

if (!(EventTarget.prototype as any).hasPointerCapture) {
  ;(EventTarget.prototype as any).setPointerCapture =
    MockPointerEvents.prototype.setPointerCapture
  ;(EventTarget.prototype as any).releasePointerCapture =
    MockPointerEvents.prototype.releasePointerCapture
  ;(EventTarget.prototype as any).hasPointerCapture =
    MockPointerEvents.prototype.hasPointerCapture
}

if (!(window as any).hasPointerCapture) {
  ;(window as any).setPointerCapture =
    MockPointerEvents.prototype.setPointerCapture
  ;(window as any).releasePointerCapture =
    MockPointerEvents.prototype.releasePointerCapture
  ;(window as any).hasPointerCapture =
    MockPointerEvents.prototype.hasPointerCapture
}

if (!(document as any).hasPointerCapture) {
  ;(document as any).setPointerCapture =
    MockPointerEvents.prototype.setPointerCapture
  ;(document as any).releasePointerCapture =
    MockPointerEvents.prototype.releasePointerCapture
  ;(document as any).hasPointerCapture =
    MockPointerEvents.prototype.hasPointerCapture
}

HTMLCanvasElement.prototype.getContext =
  vi.fn() as unknown as typeof HTMLCanvasElement.prototype.getContext

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock("@/providers/auth-provider", () => ({
  useSession: vi.fn(() => ({
    data: {
      user: {
        id: "test-user-id",
        email: "test@example.com",
        name: "Test User",
        avatar: null,
        enterprise_id: "test-enterprise-id",
        role: "admin",
        permissions: ["*"],
      },
      accessToken: "mock-access-token",
    },
    status: "authenticated",
  })),
  useAuth: vi.fn(() => ({
    user: {
      id: "test-user-id",
      email: "test@example.com",
      name: "Test User",
      avatar: null,
      enterprise_id: "test-enterprise-id",
      role: "admin",
      permissions: ["*"],
    },
    status: "authenticated",
    accessToken: "mock-access-token",
    signIn: vi.fn(),
    signOut: vi.fn(),
    refreshUser: vi.fn(),
  })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}))

const mockToast = vi.fn()
vi.mock("@/hooks/use-toast", () => ({
  toast: mockToast,
  useToast: () => ({ toast: mockToast }),
}))

export { mockToast }
