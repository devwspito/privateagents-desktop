"use client"

import { useState } from "react"
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Loader2,
  MessageSquare,
  Users,
  XCircle,
} from "lucide-react"

import type { OrchestrationState, OrchestrationStepState } from "../types"

import { cn } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"

function StepStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
    case "executing":
    case "waiting_response":
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500 shrink-0" />
    case "waiting_human":
    case "waiting_human_review":
      return <MessageSquare className="h-4 w-4 text-amber-500 shrink-0" />
    case "failed":
      return <XCircle className="h-4 w-4 text-red-500 shrink-0" />
    default:
      return (
        <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
      )
  }
}

function StepItem({
  step,
  onRespond,
}: {
  step: OrchestrationStepState
  onRespond?: (stepId: string, response: string) => void
}) {
  const [responseText, setResponseText] = useState("")

  const agentLabel = step.targetAgentName || step.targetAgentId || "Agente"

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-md border px-2.5 py-2 text-sm transition-colors",
        step.status === "executing" && "border-blue-500/30 bg-blue-500/5",
        step.status === "completed" && "border-green-500/20 bg-green-500/5",
        step.status === "failed" && "border-red-500/30 bg-red-500/5",
        step.status === "waiting_human" && "border-amber-500/30 bg-amber-500/5",
        step.status === "waiting_human_review" &&
          "border-blue-500/30 bg-blue-500/5",
        step.status === "pending" && "border-muted"
      )}
    >
      <StepStatusIcon status={step.status} />

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">
            Paso {step.stepNumber}:
          </span>
          <span className="text-muted-foreground truncate">
            {step.description || `${step.action} → @${agentLabel}`}
          </span>
        </div>

        {/* Response received */}
        {step.responseReceived && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            &rarr; {step.responseReceived}
          </p>
        )}

        {/* Error */}
        {step.error && <p className="text-xs text-red-500">{step.error}</p>}

        {/* Human input form */}
        {step.status === "waiting_human" && onRespond && (
          <div className="mt-1.5 flex gap-2">
            <input
              type="text"
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Tu respuesta..."
              className="flex-1 rounded-md border bg-background px-2 py-1 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter" && responseText.trim()) {
                  onRespond(step.id, responseText.trim())
                  setResponseText("")
                }
              }}
            />
            <button
              type="button"
              onClick={() => {
                if (responseText.trim()) {
                  onRespond(step.id, responseText.trim())
                  setResponseText("")
                }
              }}
              className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground"
            >
              Enviar
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

export function OrchestrationProgress({
  orchestration,
  onRespondToStep,
}: {
  orchestration: OrchestrationState
  onRespondToStep?: (
    orchestrationId: string,
    stepId: string,
    response: string
  ) => void
}) {
  const [expanded, setExpanded] = useState(true)

  const completedCount = orchestration.steps.filter(
    (s) => s.status === "completed"
  ).length
  const totalCount = orchestration.steps.length || orchestration.totalSteps

  const statusBadge = () => {
    switch (orchestration.status) {
      case "planning":
        return (
          <Badge variant="secondary" className="text-xs gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Planificando
          </Badge>
        )
      case "executing":
        return (
          <Badge
            variant="secondary"
            className="text-xs gap-1 bg-blue-500/10 text-blue-600"
          >
            <Loader2 className="h-3 w-3 animate-spin" />
            Ejecutando
          </Badge>
        )
      case "waiting_human":
        return (
          <Badge
            variant="secondary"
            className="text-xs gap-1 bg-amber-500/10 text-amber-600"
          >
            <MessageSquare className="h-3 w-3" />
            Esperando input
          </Badge>
        )
      case "completed":
        return (
          <Badge
            variant="secondary"
            className="text-xs gap-1 bg-green-500/10 text-green-600"
          >
            <CheckCircle2 className="h-3 w-3" />
            Completado
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="destructive" className="text-xs gap-1">
            <XCircle className="h-3 w-3" />
            Error
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="text-xs">
            Cancelado
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="w-full max-w-sm rounded-lg border bg-card text-card-foreground shadow-sm">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Users className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium truncate">
            Coordinando con {totalCount} agente{totalCount !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {statusBadge()}
          {totalCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {completedCount}/{totalCount}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Steps */}
      {expanded && orchestration.steps.length > 0 && (
        <div className="border-t px-3 py-2.5 space-y-1.5">
          {orchestration.steps.map((step) => (
            <StepItem
              key={step.id}
              step={step}
              onRespond={
                onRespondToStep
                  ? (_stepId, response) =>
                      onRespondToStep(orchestration.id, _stepId, response)
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {/* Planning state — no steps yet */}
      {expanded &&
        orchestration.status === "planning" &&
        orchestration.steps.length === 0 && (
          <div className="border-t px-3 py-2.5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Creando plan de ejecucion...</span>
            </div>
          </div>
        )}

      {/* Summary */}
      {orchestration.summary && orchestration.status === "completed" && (
        <div className="border-t px-3 py-2.5">
          <p className="text-xs text-muted-foreground">
            {orchestration.summary}
          </p>
        </div>
      )}
    </div>
  )
}
