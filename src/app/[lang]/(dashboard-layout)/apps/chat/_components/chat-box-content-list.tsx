"use client"

import { useEffect, useMemo, useRef } from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"
import { Loader2 } from "lucide-react"

import type { ChatMessage } from "@/lib/api/client/types"
import type { ChatType, MessageType, UserType } from "../types"

import { useChatHistory } from "@/lib/api/hooks"

import { useChatContext } from "../_hooks/use-chat-context"
import { ScrollBar } from "@/components/ui/scroll-area"
import { ApprovalCard } from "./approval-card"
import { IntegrationSuggestionCard } from "./integration-suggestion-card"
import { MessageBubble } from "./message-bubble"
import { RecurringTaskCard } from "./recurring-task-card"
import { StreamingMessageBubble } from "./streaming-message-bubble"

export function ChatBoxContentList({
  user,
  chat,
}: {
  user: UserType
  chat: ChatType
}) {
  const {
    chatState,
    streamState,
    handleSelectChat,
    handleSetUnreadCount,
    handleApprovalResponse,
    handleDismissIntegrationSuggestion,
    handleDismissRecurringTaskSuggestion,
    handleConfirmRecurringTask,
    handleRespondToOrchestrationStep,
  } = useChatContext()
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Check if this is a real session (not a "new:" placeholder)
  const isRealSession = !chat.id.startsWith("new:")
  const sessionKey = isRealSession ? chat.id : ""

  // Fetch messages from API for real sessions
  const { data: historyData, isLoading: loadingHistory } =
    useChatHistory(sessionKey)

  // Detect A2A thread (both participants are agents, not human)
  const isA2A = chat.isSpawned === true

  // Transform API messages to template format
  const apiMessages: MessageType[] = useMemo(() => {
    if (!historyData?.messages) return []

    // For A2A threads: user[0] = caller agent, user[1] = target agent
    const callerAgentId = isA2A ? chat.users[0]?.id : null
    const targetAgentId = isA2A ? chat.users[1]?.id : null

    return historyData.messages
      .filter(
        (msg: ChatMessage) =>
          (msg.role === "user" || msg.role === "assistant") &&
          msg.content &&
          msg.content.trim().length > 0
      )
      .map<MessageType>((msg: ChatMessage) => {
        let content = msg.content

        if (msg.role === "user") {
          // Remove injected context blocks that the backend prepends
          // to final_message but should never be shown to the user.

          // Strip [CONTEXT]...[/CONTEXT] system prompt block
          content = content.replace(
            /\[CONTEXT\][\s\S]*?\[\/CONTEXT\]\s*/g,
            ""
          )
          // Fallback: old format without [/CONTEXT]
          content = content.replace(
            /^\[CONTEXT\]\n[\s\S]*\n\n(?=\S)/,
            ""
          )

          // Safety net: strip any remaining desktop/tool context the backend missed
          content = content.replace(
            /\[DESKTOP\s*[—–-]\s*CONNECTED\][\s\S]*?NEVER say the desktop is disconnected\.\s*/,
            ""
          )
          content = content.replace(
            /\[DESKTOP_TOOLS\][\s\S]*?(?:\n\n(?=\S))/,
            ""
          )
          content = content.replace(
            /\[TOOL_MAP\][^\n]*\n(?:.*\n)*?\n/,
            ""
          )

          content = content.trim()
        }

        // Determine sender ID based on thread type
        let senderId: string
        if (isA2A) {
          // A2A: role=user is the caller agent, role=assistant is the target agent
          senderId = msg.role === "user"
            ? (callerAgentId || "caller-agent")
            : (targetAgentId || "target-agent")
        } else {
          // Private chat: role=user is the human, role=assistant is the agent
          senderId = msg.role === "user"
            ? user.id
            : chat.users.find((u) => u.id !== user.id)?.id || "agent"
        }

        return {
          id: msg.id,
          senderId,
          text: content,
          status: "READ",
          createdAt: msg.timestamp ? new Date(msg.timestamp) : new Date(),
        }
      })
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  }, [historyData?.messages, user.id, chat.users, isA2A])

  // API is the single source of truth for messages.
  // Optimistic user messages are shown separately via streamState.pendingUserMessage.
  const messages = useMemo(() => {
    if (apiMessages.length > 0) return apiMessages
    return []
  }, [apiMessages])

  // Get the agent user for streaming bubble
  const agentUser = useMemo(
    () =>
      chat.users.find((u) => u.id !== user.id) || {
        id: "agent",
        name: "Agent",
        status: "ONLINE",
      },
    [chat.users, user.id]
  )

  // Auto-scroll to bottom when messages or streaming state changes
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages, streamState.isStreaming, streamState.streamingTokens])

  // Synchronize chat selection
  useEffect(() => {
    if (chat && chat !== chatState.selectedChat) {
      handleSelectChat(chat)
    }

    if (!!chat?.unreadCount) {
      handleSetUnreadCount()
    }
  }, [chat, chatState.selectedChat, handleSelectChat, handleSetUnreadCount])

  // A map of chat users for quick lookup
  const userMap = useMemo(
    () => new Map(chat?.users.map((user) => [user.id, user])),
    [chat?.users]
  )

  if (loadingHistory && isRealSession) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm">Loading messages...</p>
        </div>
      </div>
    )
  }

  const hasContent =
    messages.length > 0 ||
    streamState.isStreaming ||
    streamState.orchestration !== null ||
    streamState.pendingUserMessage !== null

  if (!hasContent) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium">No messages yet</p>
          <p className="text-sm mt-1">
            Start the conversation by sending a message below
          </p>
        </div>
      </div>
    )
  }

  return (
    <ScrollAreaPrimitive.Root className="relative h-full">

      <ScrollAreaPrimitive.Viewport
        ref={scrollAreaRef}
        className="h-full w-full"
      >
        <ul className="flex flex-col gap-y-1.5 px-3 py-3 md:px-6 overflow-x-hidden">
          {/* Historical messages (oldest first) */}
          {messages.map((message) => {
            // Render task separators as horizontal dividers
            if (message.type === "task_separator") {
              return (
                <li key={message.id} className="flex items-center gap-3 py-2">
                  <div className="flex-1 border-t border-border" />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    Nueva tarea &middot;{" "}
                    {message.createdAt.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <div className="flex-1 border-t border-border" />
                </li>
              )
            }

            const sender = userMap.get(message.senderId) as UserType
            // A2A: caller agent on left, target agent on right
            // Private: human (current-user) on right, agent on left
            const isByCurrentUser = isA2A
              ? message.senderId === chat.users[1]?.id  // target agent = right side
              : message.senderId === user.id

            // For agent messages, pass agentId so workspace file paths become clickable
            const messageAgentId = !isByCurrentUser ? message.senderId : undefined

            return (
              <MessageBubble
                key={message.id}
                sender={
                  sender || {
                    id: message.senderId,
                    name: "Agent",
                    status: "ONLINE",
                  }
                }
                message={message}
                isByCurrentUser={isByCurrentUser}
                alwaysShowName={isA2A}
                agentId={messageAgentId}
              />
            )
          })}

          {/* Optimistic user message — shown until API history includes it */}
          {streamState.pendingUserMessage && (
            <MessageBubble
              sender={user}
              message={{
                id: "pending-user",
                senderId: user.id,
                text: streamState.pendingUserMessage,
                status: "SENT",
                createdAt: new Date(),
              }}
              isByCurrentUser={true}
            />
          )}

          {/* Inline approval card */}
          {streamState.streamingApproval && (
            <li className="flex gap-2">
              <div className="w-7 shrink-0" /> {/* Avatar spacer */}
              <ApprovalCard
                approval={streamState.streamingApproval}
                onApprove={() => handleApprovalResponse(true)}
                onReject={() => handleApprovalResponse(false)}
              />
            </li>
          )}

          {/* Integration suggestion card */}
          {streamState.streamingIntegrationSuggestion && (
            <li className="flex gap-2">
              <div className="w-7 shrink-0" />
              <IntegrationSuggestionCard
                suggestion={streamState.streamingIntegrationSuggestion}
                onConnect={() => {
                  window.location.href = `/dashboard/integrations?app=${streamState.streamingIntegrationSuggestion?.app_key}`
                }}
                onDismiss={handleDismissIntegrationSuggestion}
              />
            </li>
          )}

          {/* Recurring task suggestion card */}
          {streamState.streamingRecurringTaskSuggestion && (
            <li className="flex gap-2">
              <div className="w-7 shrink-0" />
              <RecurringTaskCard
                suggestion={streamState.streamingRecurringTaskSuggestion}
                agentId={chat.users.find((u) => u.id !== user.id)?.id || ""}
                onConfirm={handleConfirmRecurringTask}
                onDismiss={handleDismissRecurringTaskSuggestion}
              />
            </li>
          )}

          {/* Streaming bubble (always at the bottom) */}
          {(streamState.isStreaming || streamState.orchestration) && (
            <StreamingMessageBubble
              streamState={streamState}
              agentUser={agentUser}
              onRespondToOrchestrationStep={handleRespondToOrchestrationStep}
            />
          )}
        </ul>
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar orientation="vertical" />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}
