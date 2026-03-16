"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import type {
  OrchestrationState,
  OrchestrationStepStatus,
  OrchestrationStatus as _OrchestrationStatus,
  OrchestrationStepState as _OrchestrationStepState,
} from "../types"
import { fetchWithAuth } from "@/lib/fetch-with-auth"
import { API_BASE } from "@/lib/api-config"
import { readSSEStream } from "@/lib/sse-reader"

/**
 * Connects to the orchestration SSE endpoint and keeps an OrchestrationState
 * updated in real-time. Handles catch-up events + live polling + terminal events.
 */
export function useOrchestrationStream(orchestrationId: string | null) {
  const [state, setState] = useState<OrchestrationState | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const connectedIdRef = useRef<string | null>(null)

  const disconnect = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    connectedIdRef.current = null
  }, [])

  useEffect(() => {
    if (!orchestrationId) {
      disconnect()
      return
    }

    // Avoid reconnecting to the same orchestration
    if (connectedIdRef.current === orchestrationId) return

    // Disconnect previous if any
    disconnect()

    connectedIdRef.current = orchestrationId
    const controller = new AbortController()
    abortRef.current = controller

    const connect = async () => {
      try {
        const response = await fetchWithAuth(
          `${API_BASE}/orchestration/${orchestrationId}/events/stream`,
          { signal: controller.signal }
        )

        if (!response.ok || !response.body) return

        await readSSEStream(response, (event) => {
          setState((prev) =>
            applyOrchestrationEvent(prev, orchestrationId, event as Record<string, unknown>)
          )
        })
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return
        // Connection lost — could retry, but the UI can recover via polling
      }
    }

    connect()

    return () => {
      disconnect()
    }
  }, [orchestrationId, disconnect])

  return { orchestration: state, disconnect }
}

/**
 * Applies an SSE event from the orchestration stream to the current state.
 */
function applyOrchestrationEvent(
  prev: OrchestrationState | null,
  orchestrationId: string,
  event: Record<string, unknown>
): OrchestrationState {
  const base: OrchestrationState = prev ?? {
    id: orchestrationId,
    conversationId: "",
    status: "planning",
    totalSteps: 0,
    currentStep: 0,
    steps: [],
    summary: null,
  }

  const eventType = event["type"] as string

  switch (eventType) {
    case "plan_ready": {
      const steps = ((event["steps"] as unknown[]) || []).map(
        (s: unknown, i: number) => {
          const step = s as Record<string, unknown>
          return {
            id: (step["id"] as string) || `step-${i}`,
            stepNumber: (step["step_number"] as number) ?? i + 1,
            action: (step["action"] as string) || "agent_task",
            targetAgentId: (step["target_agent_id"] as string) || null,
            targetAgentName: (step["target_agent_name"] as string) || null,
            description: (step["description"] as string) || null,
            status: "pending" as OrchestrationStepStatus,
            messageSent: null,
            responseReceived: null,
            error: null,
          }
        }
      )

      return {
        ...base,
        status: "executing",
        totalSteps: steps.length,
        steps,
      }
    }

    case "step_started": {
      const stepId = event["step_id"] as string
      return {
        ...base,
        status: "executing",
        currentStep: (event["step_number"] as number) ?? base.currentStep,
        steps: base.steps.map((s) =>
          s.id === stepId
            ? { ...s, status: "executing" as OrchestrationStepStatus }
            : s
        ),
      }
    }

    case "step_completed": {
      const stepId = event["step_id"] as string
      return {
        ...base,
        currentStep: (event["step_number"] as number) ?? base.currentStep,
        steps: base.steps.map((s) =>
          s.id === stepId
            ? {
                ...s,
                status: "completed" as OrchestrationStepStatus,
                responseReceived:
                  (event["response"] as string) || s.responseReceived,
              }
            : s
        ),
      }
    }

    case "step_failed": {
      const stepId = event["step_id"] as string
      return {
        ...base,
        steps: base.steps.map((s) =>
          s.id === stepId
            ? {
                ...s,
                status: "failed" as OrchestrationStepStatus,
                error: (event["error"] as string) || "Step failed",
              }
            : s
        ),
      }
    }

    case "step_waiting_human": {
      const stepId = event["step_id"] as string
      return {
        ...base,
        status: "waiting_human",
        steps: base.steps.map((s) =>
          s.id === stepId
            ? {
                ...s,
                status: "waiting_human" as OrchestrationStepStatus,
                messageSent: (event["question"] as string) || s.messageSent,
              }
            : s
        ),
      }
    }

    case "step_waiting_human_review": {
      const stepId = event["step_id"] as string
      return {
        ...base,
        status: "waiting_human",
        steps: base.steps.map((s) =>
          s.id === stepId
            ? {
                ...s,
                status: "waiting_human_review" as OrchestrationStepStatus,
                review: {
                  escalationId: event["escalation_id"] as string,
                  stepId: event["step_id"] as string,
                  requestingAgentId: event["requesting_agent_id"] as string,
                  agentId: event["agent_id"] as string,
                  requestMessage: event["request_message"] as string,
                  draftResponse: event["draft_response"] as string,
                  assignedTo: event["assigned_to"] as string,
                },
              }
            : s
        ),
      }
    }

    case "human_responded": {
      const stepId = event["step_id"] as string
      return {
        ...base,
        status: "executing",
        steps: base.steps.map((s) =>
          s.id === stepId
            ? { ...s, status: "executing" as OrchestrationStepStatus }
            : s
        ),
      }
    }

    case "orchestration_completed": {
      return {
        ...base,
        status: "completed",
        summary: (event["summary"] as string) || base.summary,
      }
    }

    case "orchestration_failed": {
      return {
        ...base,
        status: "failed",
      }
    }

    case "orchestration_cancelled": {
      return {
        ...base,
        status: "cancelled",
      }
    }

    default:
      return base
  }
}
