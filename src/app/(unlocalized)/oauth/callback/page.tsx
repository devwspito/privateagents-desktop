"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, Loader2, XCircle } from "lucide-react"

export default function OAuthCallbackPage() {
  const searchParams = useSearchParams()
  const status = searchParams.get("status")
  const appName = searchParams.get("appName")
  const [countdown, setCountdown] = useState(3)

  const isSuccess = status === "success"

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          window.close()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-lg border bg-card p-8 text-center shadow-sm">
        {isSuccess ? (
          <>
            <CheckCircle2 className="mx-auto size-12 text-green-500" />
            <h1 className="mt-4 text-xl font-semibold">
              Connection Successful
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {appName
                ? `${appName} has been connected successfully.`
                : "The integration has been connected successfully."}
            </p>
          </>
        ) : (
          <>
            <XCircle className="mx-auto size-12 text-red-500" />
            <h1 className="mt-4 text-xl font-semibold">Connection Failed</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Something went wrong during the authentication process. Please try
              again.
            </p>
          </>
        )}

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          Closing in {countdown}s...
        </div>

        <button
          type="button"
          onClick={() => window.close()}
          className="mt-3 text-sm text-primary hover:underline"
        >
          Close now
        </button>
      </div>
    </div>
  )
}
