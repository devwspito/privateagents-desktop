"use client"

import { useState, useCallback, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { useEventStore } from "@/lib/stores/event-store"
import { useChatStream } from "../../chat/_hooks/use-chat-stream"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QuickChatMessage {
  id: string
  role: "user" | "assistant"
  text: string
  isError?: boolean
}

export interface UseQuickChatOptions {
  agentId: string
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Wraps `useChatStream` with session management, cache invalidation,
 * error handling, and retry logic for lightweight chat modals.
 *
 * Reusable anywhere a quick agent conversation is needed (Office, sidebar, etc).
 */
export function useQuickChat({ agentId }: UseQuickChatOptions) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const stream = useChatStream()

  const [messages, setMessages] = useState<QuickChatMessage[]>([])
  const [sessionKey, setSessionKey] = useState<string | null>(null)
  const sessionKeyRef = useRef<string | null>(null)

  // Keep ref in sync so callbacks always see latest value
  const updateSessionKey = useCallback((key: string) => {
    setSessionKey(key)
    sessionKeyRef.current = key
  }, [])

  /** Core send — used by send() and retry() */
  const doSend = useCallback(
    async (text: string) => {
      if (!text || stream.isStreaming) return

      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: "user", text },
      ])

      let doneReceived = false
      let tokenEventSent = false
      const emitActivity = (type: string, data: Record<string, unknown> = {}) => {
        useEventStore.getState().processEvent({
          category: "activity", type, agent_id: agentId,
          target_agent_id: null, data, ts: Date.now(),
        })
      }

      // Immediately show thinking state while waiting for first token
      emitActivity("thinking")

      await stream.sendMessage(
        {
          message: text,
          agent_id: agentId,
          session_key: sessionKeyRef.current || undefined,
        },
        {
          onSessionCreated: (key) => {
            updateSessionKey(key)
            queryClient.invalidateQueries({ queryKey: ["chat", "unified-sidebar"] })
            queryClient.invalidateQueries({ queryKey: ["chat", "threads"] })
          },
          onToken: () => {
            if (!tokenEventSent) {
              tokenEventSent = true
              emitActivity("responding")
            }
          },
          onThinking: () => {
            emitActivity("thinking")
          },
          onToolCall: (toolCall) => {
            emitActivity("tool_call", { tool_name: toolCall.tool_name })
            tokenEventSent = false
          },
          onDone: (_messageId, newSessionKey, finalTokens) => {
            emitActivity("idle")
            doneReceived = true
            const resolvedKey = newSessionKey || sessionKeyRef.current
            if (newSessionKey && !sessionKeyRef.current) {
              updateSessionKey(newSessionKey)
            }
            if (finalTokens) {
              setMessages((prev) => [
                ...prev,
                { id: `asst-${Date.now()}`, role: "assistant", text: finalTokens },
              ])
            }
            if (resolvedKey) {
              queryClient.invalidateQueries({ queryKey: ["chat", "history", resolvedKey] })
            }
            queryClient.invalidateQueries({ queryKey: ["chat", "unified-sidebar"] })
          },
          onError: (error) => {
            emitActivity("idle", { error: true })
            doneReceived = true
            toast({ variant: "destructive", title: "Error en el chat", description: error })
            setMessages((prev) => [
              ...prev,
              { id: `err-${Date.now()}`, role: "assistant", text: `Error: ${error}`, isError: true },
            ])
          },
        }
      )

      // Fallback: stream closed without done/error (connection lost)
      if (!doneReceived) {
        if (stream.tokens) {
          setMessages((prev) => [
            ...prev,
            {
              id: `asst-${Date.now()}`,
              role: "assistant",
              text: stream.tokens + "\n\n_(respuesta incompleta)_",
            },
          ])
        } else {
          toast({
            variant: "destructive",
            title: "Sin respuesta",
            description: "El agente no respondió. Intenta de nuevo.",
          })
          setMessages((prev) => [
            ...prev,
            {
              id: `err-${Date.now()}`,
              role: "assistant",
              text: "No se recibió respuesta del agente.",
              isError: true,
            },
          ])
        }
      }
    },
    [stream, agentId, queryClient, toast, updateSessionKey]
  )

  /** Send a new message */
  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (trimmed) doSend(trimmed)
    },
    [doSend]
  )

  /** Retry the last failed message */
  const retry = useCallback(() => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")
    if (!lastUserMsg) return
    setMessages((prev) => prev.filter((m) => !m.isError && m.id !== lastUserMsg.id))
    doSend(lastUserMsg.text)
  }, [messages, doSend])

  /** Reset all state (on dialog close) */
  const reset = useCallback(() => {
    setMessages([])
    setSessionKey(null)
    sessionKeyRef.current = null
    stream.reset()
  }, [stream])

  return {
    messages,
    sessionKey,
    isStreaming: stream.isStreaming,
    streamTokens: stream.tokens,
    streamThinking: stream.thinking,
    streamToolCalls: stream.toolCalls,
    send,
    retry,
    reset,
  }
}
