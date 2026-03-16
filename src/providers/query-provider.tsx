"use client"

import { useCallback, useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { ErrorBoundary } from "@/components/error-boundary"
import { useErrorCapture } from "@/providers/error-capture-provider"

/** Shared query client — accessible from outside React tree (e.g. auth signOut). */
let _sharedClient: QueryClient | null = null
export function getQueryClient(): QueryClient | null {
  return _sharedClient
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const { openReportDialog } = useErrorCapture()

  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 10 * 60 * 1000, // 10 minutes
          refetchOnWindowFocus: false,
          retry: (failureCount, error) => {
            // Don't retry auth errors — NextAuth handles token refresh
            if (
              error &&
              typeof error === "object" &&
              "status" in error &&
              (error as { status: number }).status === 401
            ) {
              return false
            }
            return failureCount < 3
          },
        },
      },
    })
    _sharedClient = client
    return client
  })

  const handleReset = useCallback(() => {
    queryClient.clear()
  }, [queryClient])

  const handleReport = useCallback(
    (error: { message: string; stack?: string; url?: string; timestamp: string }) => {
      openReportDialog(error)
    },
    [openReportDialog]
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary onReset={handleReset} onReport={handleReport}>
        {children}
      </ErrorBoundary>
    </QueryClientProvider>
  )
}
