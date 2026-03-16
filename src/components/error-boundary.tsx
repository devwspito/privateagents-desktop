"use client"

import { Component, type ReactNode } from "react"
import { AlertTriangle, Bug, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"

interface Props {
  children: ReactNode
  onReset?: () => void
  onReport?: (error: {
    message: string
    stack?: string
    component?: string
    url?: string
    timestamp: string
  }) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  handleReset = () => {
    this.props.onReset?.()
    this.setState({ hasError: false, error: null })
  }

  handleReport = () => {
    if (this.props.onReport && this.state.error) {
      this.props.onReport({
        message: this.state.error.message,
        stack: this.state.error.stack,
        url: typeof window !== "undefined" ? window.location.href : undefined,
        timestamp: new Date().toISOString(),
      })
    }
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8">
          <AlertTriangle className="size-12 text-destructive" />
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="text-sm text-muted-foreground max-w-md text-center">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <div className="flex gap-2">
            <Button onClick={this.handleReset} variant="outline">
              <RefreshCw className="mr-2 size-4" />
              Try again
            </Button>
            {this.props.onReport && (
              <Button onClick={this.handleReport} variant="destructive">
                <Bug className="mr-2 size-4" />
                Report to Support
              </Button>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
