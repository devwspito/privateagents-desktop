declare global {
  interface Window {
    __TAURI__?: Record<string, unknown>
    __TAURI_INTERNALS__?: Record<string, unknown>
  }
}

export {}
