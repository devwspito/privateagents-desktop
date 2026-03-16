"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function UsersError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Users page error:", error)
  }, [error])

  return (
    <div className="container p-6 flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-red-600">
            Users Error
          </CardTitle>
          <CardDescription className="text-center">
            Failed to load users data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error.message ||
                "An unexpected error occurred while loading users. Please try again."}
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={reset} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" /> Try again
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
