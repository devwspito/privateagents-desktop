/**
 * Hook to monitor authentication status
 */

import { useAuth } from "@/providers/auth-provider"

export interface AuthStatus {
  isAuthenticated: boolean
  isLoading: boolean
  hasError: boolean
  errorMessage?: string
}

export function useAuthStatus(): AuthStatus {
  const { status } = useAuth()

  return {
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    hasError: false,
  }
}
