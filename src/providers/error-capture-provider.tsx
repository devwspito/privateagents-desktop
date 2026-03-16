"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"

import { SupportDialog } from "@/components/support-dialog"

interface CapturedError {
  message: string
  stack?: string
  component?: string
  url?: string
  timestamp: string
}

interface ErrorCaptureContextValue {
  reportError: (error: CapturedError) => void
  openReportDialog: (error?: Partial<CapturedError>) => void
}

const ErrorCaptureContext = createContext<ErrorCaptureContextValue>({
  reportError: () => {},
  openReportDialog: () => {},
})

export function useErrorCapture() {
  return useContext(ErrorCaptureContext)
}

export function ErrorCaptureProvider({ children }: { children: ReactNode }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentError, setCurrentError] = useState<CapturedError | undefined>()
  const recentErrors = useRef<CapturedError[]>([])

  const reportError = useCallback((error: CapturedError) => {
    recentErrors.current = [error, ...recentErrors.current.slice(0, 4)]
  }, [])

  const openReportDialog = useCallback(
    (error?: Partial<CapturedError>) => {
      const errorData: CapturedError = {
        message: error?.message || recentErrors.current[0]?.message || "Unknown error",
        stack: error?.stack || recentErrors.current[0]?.stack,
        component: error?.component || recentErrors.current[0]?.component,
        url: error?.url || (typeof window !== "undefined" ? window.location.href : undefined),
        timestamp: error?.timestamp || new Date().toISOString(),
      }
      setCurrentError(errorData)
      setDialogOpen(true)
    },
    []
  )

  // Global error handlers
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const error: CapturedError = {
        message: event.message,
        stack: event.error?.stack,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      }
      reportError(error)
    }

    const handleRejection = (event: PromiseRejectionEvent) => {
      const error: CapturedError = {
        message:
          event.reason instanceof Error
            ? event.reason.message
            : String(event.reason),
        stack: event.reason instanceof Error ? event.reason.stack : undefined,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      }
      reportError(error)
    }

    window.addEventListener("error", handleError)
    window.addEventListener("unhandledrejection", handleRejection)
    return () => {
      window.removeEventListener("error", handleError)
      window.removeEventListener("unhandledrejection", handleRejection)
    }
  }, [reportError])

  return (
    <ErrorCaptureContext.Provider value={{ reportError, openReportDialog }}>
      {children}
      <SupportDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        errorData={currentError}
      />
    </ErrorCaptureContext.Provider>
  )
}
