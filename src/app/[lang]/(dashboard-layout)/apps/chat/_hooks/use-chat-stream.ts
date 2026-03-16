"use client"

import { useCallback, useRef, useState } from "react"

import type {
  OrchestrationState,
  OrchestrationStepState as _OrchestrationStepState,
  OrchestrationStepStatus as _OrchestrationStepStatus,
} from "../types"
import { fetchWithAuth } from "@/lib/fetch-with-auth"
import { API_BASE } from "@/lib/api-config"
import { readSSEStream } from "@/lib/sse-reader"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ToolCallEvent {
  tool_name: string
  tool_args: Record<string, unknown>
  status: "running" | "completed" | "failed"
  startedAt: number
}

export interface ApprovalEvent {
  approval_id: string
  action: string
  params: Record<string, unknown>
  preview: string
}

export interface IntegrationSuggestionEvent {
  app_key: string
  app_name: string
  logo_url: string
  description: string
  missing_tool: string
}

export interface RecurringTaskSuggestionEvent {
  title: string
  schedule: string
  timezone: string
  description?: string
}

export interface OrchestrationStartedEvent {
  orchestration_id: string
  conversation_id: string
  mention_count: number
}

export interface StreamState {
  isStreaming: boolean
  tokens: string
  thinking: string | null
  toolCalls: ToolCallEvent[]
  approval: ApprovalEvent | null
  integrationSuggestion: IntegrationSuggestionEvent | null
  recurringTaskSuggestion: RecurringTaskSuggestionEvent | null
  error: string | null
  sessionKey: string | null
  messageId: string | null
  orchestration: OrchestrationState | null
}

interface SendMessageParams {
  message: string
  session_key?: string
  agent_id?: string
  context_hint?: string
}

const INITIAL_STATE: StreamState = {
  isStreaming: false,
  tokens: "",
  thinking: null,
  toolCalls: [],
  approval: null,
  integrationSuggestion: null,
  recurringTaskSuggestion: null,
  error: null,
  sessionKey: null,
  messageId: null,
  orchestration: null,
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useChatStream() {
  const [state, setState] = useState<StreamState>(INITIAL_STATE)
  const abortRef = useRef<AbortController | null>(null)

  /** Reset stream state for a new message */
  const reset = useCallback(() => {
    setState(INITIAL_STATE)
  }, [])

  /** Abort the current stream */
  const abort = useCallback(async (sessionKey?: string) => {
    abortRef.current?.abort()
    abortRef.current = null

    // Also tell the backend to abort
    if (sessionKey) {
      try {
        await fetchWithAuth(
          `${API_BASE}/chat/${encodeURIComponent(sessionKey)}/abort`,
          { method: "POST" }
        )
      } catch {
        // Best effort
      }
    }

    setState((prev) => ({ ...prev, isStreaming: false }))
  }, [])

  /** Send a message and consume the SSE stream */
  const sendMessage = useCallback(
    async (
      params: SendMessageParams,
      callbacks?: {
        onToken?: (accumulated: string) => void
        onThinking?: (thinking: string) => void
        onToolCall?: (toolCall: ToolCallEvent) => void
        onApproval?: (approval: ApprovalEvent) => void
        onIntegrationSuggestion?: (
          suggestion: IntegrationSuggestionEvent
        ) => void
        onRecurringTaskSuggestion?: (
          suggestion: RecurringTaskSuggestionEvent
        ) => void
        onDone?: (
          messageId: string | null,
          sessionKey: string | null,
          finalTokens: string
        ) => void
        onError?: (error: string) => void
        onSessionCreated?: (sessionKey: string) => void
        onOrchestrationStarted?: (data: OrchestrationStartedEvent) => void
      }
    ) => {
      // Abort any in-flight stream
      abortRef.current?.abort()

      const controller = new AbortController()
      abortRef.current = controller

      // Reset state
      setState({
        ...INITIAL_STATE,
        isStreaming: true,
        sessionKey: params.session_key || null,
      })

      // No safety timeout — tasks can be arbitrarily long (orchestrations, complex work)

      try {
        const response = await fetchWithAuth(`${API_BASE}/chat/send/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
          signal: controller.signal,
        })

        if (!response.ok) {
          const errText = await response.text()
          const error = `HTTP ${response.status}: ${errText}`
          setState((prev) => ({ ...prev, isStreaming: false, error }))
          callbacks?.onError?.(error)
          return
        }

        if (!response.body) {
          const error = "No response body"
          setState((prev) => ({ ...prev, isStreaming: false, error }))
          callbacks?.onError?.(error)
          return
        }

        let accumulatedTokens = ""
        let accumulatedThinking = ""
        let currentSessionKey = params.session_key || null
        let doneMessageId: string | null = null

        await readSSEStream(response, (data) => {
          const event = data as Record<string, unknown>

          switch (event.type as string) {
                case "token": {
                  accumulatedTokens += event.content || ""
                  setState((prev) => ({
                    ...prev,
                    tokens: accumulatedTokens,
                  }))
                  callbacks?.onToken?.(accumulatedTokens)
                  break
                }

                case "thinking": {
                  accumulatedThinking += event.content || ""
                  setState((prev) => ({
                    ...prev,
                    thinking: accumulatedThinking,
                  }))
                  callbacks?.onThinking?.(accumulatedThinking)
                  break
                }

                case "tool_call": {
                  const toolCall: ToolCallEvent = {
                    tool_name: event.tool_name,
                    tool_args: event.tool_args || {},
                    status: "running",
                    startedAt: Date.now(),
                  }
                  setState((prev) => ({
                    ...prev,
                    toolCalls: [...prev.toolCalls, toolCall],
                  }))
                  callbacks?.onToolCall?.(toolCall)
                  break
                }

                case "approval_required": {
                  const approval: ApprovalEvent = {
                    approval_id: event.approval_id || "",
                    action: event.action,
                    params: event.params || {},
                    preview: event.preview || "",
                  }
                  setState((prev) => ({ ...prev, approval }))
                  callbacks?.onApproval?.(approval)
                  break
                }

                case "integration_suggestion": {
                  const suggestion: IntegrationSuggestionEvent = {
                    app_key: event.app_key || "",
                    app_name: event.app_name || "",
                    logo_url: event.logo_url || "",
                    description: event.description || "",
                    missing_tool: event.missing_tool || "",
                  }
                  setState((prev) => ({
                    ...prev,
                    integrationSuggestion: suggestion,
                  }))
                  callbacks?.onIntegrationSuggestion?.(suggestion)
                  break
                }

                case "recurring_task_suggestion": {
                  const suggestion: RecurringTaskSuggestionEvent = {
                    title: event.title || "",
                    schedule: event.schedule || "0 9 * * *",
                    timezone: event.timezone || "Europe/Madrid",
                    description: event.description || "",
                  }
                  setState((prev) => ({
                    ...prev,
                    recurringTaskSuggestion: suggestion,
                  }))
                  callbacks?.onRecurringTaskSuggestion?.(suggestion)
                  break
                }

                case "ping": {
                  // Keepalive from backend — ignore
                  break
                }

                case "session": {
                  currentSessionKey = event.session_key
                  setState((prev) => ({
                    ...prev,
                    sessionKey: event.session_key,
                  }))
                  callbacks?.onSessionCreated?.(event.session_key)
                  break
                }

                case "a2a_spawned": {
                  // Sub-agent spawned — show it as a running tool call
                  const agentId = (event.agent_id || event.target_agent_id || "") as string
                  const spawnCall: ToolCallEvent = {
                    tool_name: "sessions_spawn",
                    tool_args: { agentId },
                    status: "running",
                    startedAt: Date.now(),
                  }
                  setState((prev) => ({
                    ...prev,
                    toolCalls: [...prev.toolCalls, spawnCall],
                  }))
                  callbacks?.onToolCall?.(spawnCall)
                  break
                }

                case "a2a_done": {
                  // Sub-agent finished — mark the matching spawn as completed
                  setState((prev) => ({
                    ...prev,
                    toolCalls: prev.toolCalls.map((tc) =>
                      tc.tool_name === "sessions_spawn" && tc.status === "running"
                        ? { ...tc, status: "completed" as const }
                        : tc
                    ),
                  }))
                  break
                }

                case "orchestration_started": {
                  const orchState: OrchestrationState = {
                    id: event.orchestration_id,
                    conversationId: event.conversation_id,
                    status: "planning",
                    totalSteps: 0,
                    currentStep: 0,
                    steps: [],
                    summary: null,
                  }
                  setState((prev) => ({
                    ...prev,
                    orchestration: orchState,
                  }))
                  callbacks?.onOrchestrationStarted?.({
                    orchestration_id: event.orchestration_id,
                    conversation_id: event.conversation_id,
                    mention_count: event.mention_count || 0,
                  })
                  break
                }

                case "done": {
                  doneMessageId = event.id || null
                  setState((prev) => ({
                    ...prev,
                    isStreaming: false,
                    messageId: doneMessageId,
                  }))
                  callbacks?.onDone?.(
                    doneMessageId,
                    currentSessionKey,
                    accumulatedTokens
                  )
                  // Native notification when window is not focused (Tauri desktop)
                  if (typeof document !== "undefined" && document.hidden) {
                    import("@/lib/tauri")
                      .then(({ sendNotification }) => {
                        const preview = accumulatedTokens.slice(0, 100)
                        sendNotification(
                          "Agent responded",
                          preview || "Message received"
                        )
                      })
                      .catch(() => {
                        /* not in Tauri */
                      })
                  }
                  break
                }

                case "error": {
                  const errorMsg = event.message || "Unknown stream error"
                  setState((prev) => ({
                    ...prev,
                    isStreaming: false,
                    error: errorMsg,
                  }))
                  callbacks?.onError?.(errorMsg)
                  break
                }
              }
        })

        // Stream ended without a "done" event (connection closed)
        setState((prev) => {
          if (prev.isStreaming) {
            return { ...prev, isStreaming: false }
          }
          return prev
        })
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          // User-initiated abort — not an error
          setState((prev) => ({ ...prev, isStreaming: false }))
          return
        }

        const error = err instanceof Error ? err.message : "Connection failed"
        setState((prev) => ({ ...prev, isStreaming: false, error }))
        callbacks?.onError?.(error)
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null
        }
      }
    },
    []
  )

  return {
    ...state,
    sendMessage,
    abort,
    reset,
  }
}
