"use client"

import { ExternalLink, Plug, X } from "lucide-react"

import type { IntegrationSuggestionEvent } from "../_hooks/use-chat-stream"

import { AppLogo } from "@/components/app-logo"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function IntegrationSuggestionCard({
  suggestion,
  onConnect,
  onDismiss,
}: {
  suggestion: IntegrationSuggestionEvent
  onConnect: () => void
  onDismiss: () => void
}) {
  return (
    <Card className="w-full max-w-sm border-blue-500/50 bg-blue-500/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Plug className="h-4 w-4 text-blue-500" />
            <span>Integracion sugerida</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onDismiss}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="flex items-start gap-3">
          <AppLogo
            appName={suggestion.app_name}
            appKey={suggestion.app_key}
            logoUrl={suggestion.logo_url}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">
              {suggestion.app_name}
            </p>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {suggestion.description}
            </p>
          </div>
        </div>
        {suggestion.missing_tool && (
          <p className="text-xs text-muted-foreground mt-2">
            Herramienta requerida:{" "}
            <code className="text-xs bg-muted px-1 rounded">
              {suggestion.missing_tool}
            </code>
          </p>
        )}
      </CardContent>

      <CardFooter className="gap-2 pt-0">
        <Button size="sm" onClick={onConnect} className="gap-1.5">
          <ExternalLink className="h-3.5 w-3.5" />
          Conectar
        </Button>
        <Button size="sm" variant="ghost" onClick={onDismiss}>
          Ignorar
        </Button>
      </CardFooter>
    </Card>
  )
}
