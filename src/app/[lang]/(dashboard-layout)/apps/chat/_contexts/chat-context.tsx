"use client"

import { createContext, useCallback, useEffect, useReducer, useRef, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"

import type { FileType } from "@/types"
import type { ReactNode } from "react"
import type {
  ChatContextType,
  ChatStreamState,
  ChatType,
  OrchestrationState as _OrchestrationState,
} from "../types"

import api from "@/lib/api/client"

import { useEventStore } from "@/lib/stores/event-store"
import { useChatStream } from "../_hooks/use-chat-stream"
import { useOrchestrationStream } from "../_hooks/use-orchestration-stream"
import { useToast } from "@/hooks/use-toast"
import { ChatReducer } from "../_reducers/chat-reducer"

// Context hints injected as system instructions for the first message in a new chat.
// Keyed by the ?context= query param value.
const CONTEXT_HINTS: Record<string, string> = {
  create_department:
    "[SYSTEM CONTEXT — Department Builder]\n" +
    "The user navigated here from the 'Create Department' dialog. " +
    "They want to build a new department from scratch. " +
    "Interpret their next message as a description of the team they need. " +
    "Use team_* tools (team_list_templates, team_create_department, team_create_agent, etc.) " +
    "to create the department, agents with system prompts, and optionally workflows and communication rules.\n" +
    "Steps: 1) Understand their needs, 2) Propose a plan (department name, agents, roles, models), " +
    "3) Wait for their approval, 4) Execute creation with team_* tools, 5) Report summary.",
}

// Create Chat context
export const ChatContext = createContext<ChatContextType | undefined>(undefined)

const INITIAL_STREAM_STATE: ChatStreamState = {
  isStreaming: false,
  streamingTokens: "",
  streamingThinking: null,
  streamingToolCalls: [],
  streamingApproval: null,
  streamingIntegrationSuggestion: null,
  streamingRecurringTaskSuggestion: null,
  streamingError: null,
  orchestration: null,
  pendingUserMessage: null,
}

export function ChatProvider({
  chatsData,
  children,
}: {
  chatsData: ChatType[]
  children: ReactNode
}) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const lang = (params["lang"] as string) || "es"
  const { toast } = useToast()

  // Context hint from URL query param (e.g., ?context=create_department)
  const contextHintRef = useRef(searchParams?.get("context") || null)

  // Reducer to manage Chat state
  const [chatState, dispatch] = useReducer(ChatReducer, {
    chats: chatsData,
    selectedChat: null,
  })

  // Sync chats from API when data changes (threads/sidebar poll)
  const prevChatsRef = useRef(chatsData)
  useEffect(() => {
    if (chatsData !== prevChatsRef.current) {
      prevChatsRef.current = chatsData
      dispatch({ type: "syncChats", chats: chatsData })
    }
  }, [chatsData])

  // Sidebar state management
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(false)

  // Streaming state (mirrors useChatStream but exposed via context)
  const [streamState, setStreamState] =
    useState<ChatStreamState>(INITIAL_STREAM_STATE)

  // Track active orchestration ID for the SSE stream
  const [activeOrchestrationId, setActiveOrchestrationId] = useState<
    string | null
  >(null)

  // Orchestration SSE stream (connects when an orchestration is active)
  const { orchestration: orchStreamState } = useOrchestrationStream(
    activeOrchestrationId
  )

  // Sync orchestration stream state into the main stream state
  useEffect(() => {
    if (
      orchStreamState &&
      orchStreamState !== streamState.orchestration &&
      streamState.orchestration?.id === orchStreamState.id
    ) {
      setStreamState((prev) => ({
        ...prev,
        orchestration: orchStreamState,
      }))
    }
  }, [orchStreamState, streamState.orchestration])

  // Event-based cache invalidation is handled globally by useEventInvalidation()
  // (mounted in Layout component) — no need to duplicate here.

  // SSE streaming hook
  const chatStream = useChatStream()

  // Handler for sending text messages via SSE streaming
  const handleAddTextMessage = useCallback(
    async (text: string) => {
      const selectedChat = chatState.selectedChat
      if (!selectedChat) return

      const isNewConversation = selectedChat.id.startsWith("new:")
      const agentId = isNewConversation
        ? selectedChat.id.replace("new:", "")
        : selectedChat.users.find((u) => u.id !== "current-user")?.id

      // 1. Show user message as pending bubble + start streaming
      setStreamState({
        ...INITIAL_STREAM_STATE,
        isStreaming: true,
        pendingUserMessage: text,
      })

      // Determine session key and agent ID for the stream
      let sessionKey: string | undefined
      let streamAgentId: string | undefined = agentId

      if (isNewConversation && agentId) {
        // For new conversations, don't pass session_key — backend will create one
        streamAgentId = agentId
      } else {
        sessionKey = selectedChat.id
      }

      // Helper: feed activity events to the office (via Zustand store)
      let tokenEventSent = false
      const emitActivity = (type: string, data: Record<string, unknown> = {}) => {
        if (!streamAgentId) return
        useEventStore.getState().processEvent({
          category: "activity", type, agent_id: streamAgentId,
          target_agent_id: null, data, ts: Date.now(),
        })
      }

      // Immediately show thinking state while waiting for first token
      emitActivity("thinking")

      // Resolve context hint for new conversations (first message only)
      let contextHint: string | undefined
      if (isNewConversation && contextHintRef.current) {
        contextHint = CONTEXT_HINTS[contextHintRef.current]
        contextHintRef.current = null // Only inject on first message
      }

      // 3. Stream the response via SSE
      await chatStream.sendMessage(
        {
          message: text,
          session_key: sessionKey,
          agent_id: streamAgentId,
          context_hint: contextHint,
        },
        {
          onToken: (accumulated) => {
            setStreamState((prev) => ({
              ...prev,
              streamingTokens: accumulated,
            }))
            if (!tokenEventSent) {
              tokenEventSent = true
              emitActivity("responding")
            }
          },
          onThinking: (thinking) => {
            setStreamState((prev) => ({
              ...prev,
              streamingThinking: thinking,
            }))
            emitActivity("thinking")
          },
          onToolCall: (toolCall) => {
            setStreamState((prev) => ({
              ...prev,
              streamingToolCalls: [...prev.streamingToolCalls, toolCall],
            }))
            emitActivity("tool_call", { tool_name: toolCall.tool_name })
            tokenEventSent = false // reset so next token triggers "responding" again
            // A2A spawn creates a new thread — refresh sidebar immediately
            if (toolCall.tool_name === "sessions_spawn") {
              queryClient.invalidateQueries({
                queryKey: ["chat", "threads"],
              })
              queryClient.invalidateQueries({
                queryKey: ["chat", "unified-sidebar"],
              })
            }
          },
          onApproval: (approval) => {
            setStreamState((prev) => ({
              ...prev,
              streamingApproval: approval,
            }))
          },
          onIntegrationSuggestion: (suggestion) => {
            setStreamState((prev) => ({
              ...prev,
              streamingIntegrationSuggestion: suggestion,
            }))
          },
          onRecurringTaskSuggestion: (suggestion) => {
            setStreamState((prev) => ({
              ...prev,
              streamingRecurringTaskSuggestion: suggestion,
            }))
          },
          onSessionCreated: (newSessionKey) => {
            // New session created — update the chat's ID and URL
            if (isNewConversation) {
              dispatch({
                type: "updateChatId",
                oldId: selectedChat.id,
                newId: newSessionKey,
              })
              // Update URL to match the new session key so ChatBox can find it
              router.replace(
                `/${lang}/apps/chat/${encodeURIComponent(newSessionKey)}`
              )
            }
            // Refresh sidebar and threads (A2A spawns create new threads)
            queryClient.invalidateQueries({
              queryKey: ["chat", "unified-sidebar"],
            })
            queryClient.invalidateQueries({
              queryKey: ["chat", "threads"],
            })
          },
          onOrchestrationStarted: (data) => {
            // An orchestration was triggered — start tracking it
            setActiveOrchestrationId(data.orchestration_id)
            setStreamState((prev) => ({
              ...prev,
              orchestration: {
                id: data.orchestration_id,
                conversationId: data.conversation_id,
                status: "planning",
                totalSteps: 0,
                currentStep: 0,
                steps: [],
                summary: null,
              },
            }))
          },
          onDone: (_messageId, _sessionKey, _finalTokens) => {
            emitActivity("idle")
            // Clear pending user message and streaming state.
            // API history (invalidated below) is the single source of truth.
            setStreamState((prev) => {
              const orchStillActive =
                prev.orchestration &&
                prev.orchestration.status !== "completed" &&
                prev.orchestration.status !== "failed" &&
                prev.orchestration.status !== "cancelled"

              return {
                ...INITIAL_STREAM_STATE,
                orchestration: orchStillActive ? prev.orchestration : null,
              }
            })

            // Invalidate queries so history and sidebar refresh
            queryClient.invalidateQueries({
              queryKey: ["chat", "history"],
            })
            queryClient.invalidateQueries({
              queryKey: ["chat", "unified-sidebar"],
            })
            queryClient.invalidateQueries({
              queryKey: ["chat", "threads"],
            })
          },
          onError: (error) => {
            emitActivity("idle", { error: true })
            setStreamState((prev) => ({
              ...prev,
              isStreaming: false,
              streamingError: error,
            }))
            toast({
              variant: "destructive",
              title: "Message failed",
              description: error,
            })
          },
        }
      )
    },
    [chatState.selectedChat, chatStream, queryClient, toast]
  )

  // Abort the current stream
  const handleAbortStream = useCallback(() => {
    const sessionKey = chatState.selectedChat?.id
    chatStream.abort(sessionKey)
    setStreamState(INITIAL_STREAM_STATE)
  }, [chatState.selectedChat, chatStream])

  // Start a new task within the same chat (creates a new OpenClaw session)
  const handleNewTask = useCallback(() => {
    const selectedChat = chatState.selectedChat
    if (!selectedChat || streamState.isStreaming) return

    const agentId = selectedChat.users.find((u) => u.id !== "current-user")?.id
    if (!agentId) return

    // Reset the chat to a new conversation so the next message creates a fresh OpenClaw session
    dispatch({ type: "resetToNewConversation", agentId })

    // Refresh sidebar, threads, and session selector
    queryClient.invalidateQueries({ queryKey: ["chat", "unified-sidebar"] })
    queryClient.invalidateQueries({ queryKey: ["chat", "threads"] })
    queryClient.invalidateQueries({ queryKey: ["chat", "agent-sessions"] })

    // Navigate to the new chat URL so it opens directly
    router.push(`/${lang}/apps/chat/${encodeURIComponent(`new:${agentId}`)}`)
  }, [chatState.selectedChat, streamState.isStreaming, queryClient, router, lang])

  // Handle approval response (approve or reject)
  const handleApprovalResponse = useCallback(
    async (approved: boolean) => {
      const selectedChat = chatState.selectedChat
      if (!selectedChat || !streamState.streamingApproval) return

      const agentId = selectedChat.users.find(
        (u) => u.id !== "current-user"
      )?.id
      const action = streamState.streamingApproval.action
      const approvalId = streamState.streamingApproval.approval_id

      // 1. Call formal approval API to record the decision
      if (approvalId) {
        try {
          await api.approveChatAction({
            action_id: approvalId,
            approved,
            session_key: selectedChat.id.startsWith("new:")
              ? undefined!
              : selectedChat.id,
          })
        } catch (err) {
          console.warn("chat_approval_api_failed", err)
        }
      }

      // 2. Send the approval/rejection as a follow-up message to the agent
      const responseText = approved
        ? `Approved: execute ${action}`
        : `Cancelled: do not execute ${action}`

      // Clear the approval, show pending message
      setStreamState((prev) => ({
        ...prev,
        streamingApproval: null,
        isStreaming: true,
        pendingUserMessage: responseText,
      }))

      // Send via stream
      chatStream.sendMessage(
        {
          message: responseText,
          session_key: selectedChat.id,
          agent_id: agentId,
        },
        {
          onToken: (accumulated) => {
            setStreamState((prev) => ({
              ...prev,
              streamingTokens: accumulated,
            }))
          },
          onToolCall: (toolCall) => {
            setStreamState((prev) => ({
              ...prev,
              streamingToolCalls: [...prev.streamingToolCalls, toolCall],
            }))
          },
          onDone: () => {
            setStreamState(INITIAL_STREAM_STATE)
            queryClient.invalidateQueries({ queryKey: ["chat", "history"] })
          },
          onError: (error) => {
            setStreamState((prev) => ({
              ...prev,
              isStreaming: false,
              streamingError: error,
            }))
          },
        }
      )
    },
    [
      chatState.selectedChat,
      streamState.streamingApproval,
      chatStream,
      queryClient,
    ]
  )

  // Dismiss integration suggestion
  const handleDismissIntegrationSuggestion = useCallback(() => {
    setStreamState((prev) => ({
      ...prev,
      streamingIntegrationSuggestion: null,
    }))
  }, [])

  // Dismiss recurring task suggestion
  const handleDismissRecurringTaskSuggestion = useCallback(() => {
    setStreamState((prev) => ({
      ...prev,
      streamingRecurringTaskSuggestion: null,
    }))
  }, [])

  // Confirm recurring task was created successfully
  const handleConfirmRecurringTask = useCallback(() => {
    toast({
      title: "Tarea recurrente creada",
      description:
        "La tarea se ejecutara automaticamente segun el schedule configurado.",
    })
    setStreamState((prev) => ({
      ...prev,
      streamingRecurringTaskSuggestion: null,
    }))
    queryClient.invalidateQueries({ queryKey: ["recurring-tasks"] })
  }, [queryClient, toast])

  // Handlers for message actions (keeping local state for images/files)
  const handleAddImagesMessage = (images: FileType[]) => {
    dispatch({ type: "addImagesMessage", images })
  }

  const handleAddFilesMessage = (files: FileType[]) => {
    dispatch({ type: "addFilesMessage", files })
  }

  // Handlers for chat actions
  const handleSetUnreadCount = () => {
    dispatch({ type: "setUnreadCount" })
  }

  // Selection handlers
  const handleSelectChat = (chat: ChatType) => {
    // When switching chats, clear any active orchestration
    setActiveOrchestrationId(null)
    setStreamState(INITIAL_STREAM_STATE)
    dispatch({ type: "selectChat", chat })
  }

  // Switch to a different session within the same agent chat
  const handleSelectSession = useCallback(
    (sessionKey: string) => {
      setStreamState(INITIAL_STREAM_STATE)
      dispatch({ type: "selectSession", sessionKey })
      queryClient.invalidateQueries({ queryKey: ["chat", "history"] })
    },
    [queryClient]
  )

  // Respond to a step that is waiting for human input
  const handleRespondToOrchestrationStep = useCallback(
    async (orchestrationId: string, stepId: string, response: string) => {
      try {
        await api.respondToOrchestrationStep({ orchestration_id: orchestrationId, step_id: stepId, response })
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Failed to respond",
          description: err instanceof Error ? err.message : "Unknown error",
        })
      }
    },
    [toast]
  )

  return (
    <ChatContext.Provider
      value={{
        chatState,
        streamState,
        isChatSidebarOpen,
        setIsChatSidebarOpen,
        handleSelectChat,
        handleSelectSession,
        handleAddTextMessage,
        handleAddImagesMessage,
        handleAddFilesMessage,
        handleSetUnreadCount,
        handleAbortStream,
        handleNewTask,
        handleApprovalResponse,
        handleDismissIntegrationSuggestion,
        handleDismissRecurringTaskSuggestion,
        handleConfirmRecurringTask,
        handleRespondToOrchestrationStep,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}
