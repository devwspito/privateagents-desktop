/**
 * Client-side API base URL — single source of truth.
 */
export const API_BASE =
  process.env["NEXT_PUBLIC_API_URL"] || "http://localhost:8000/api"
