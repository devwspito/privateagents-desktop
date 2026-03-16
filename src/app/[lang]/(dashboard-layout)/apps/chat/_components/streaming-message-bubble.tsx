"use client"

import { Loader2 } from "lucide-react"

import type { ChatStreamState, UserType } from "../types"

import { cn as _cn } from "@/lib/utils"

import { ChatAvatar } from "./chat-avatar"
import { MessageBubbleContentText } from "./message-bubble-content-text"
import { OrchestrationProgress } from "./orchestration-progress"
import { ThinkingBubble } from "./thinking-bubble"
import { ToolCallProgress } from "./tool-call-progress"

/**
 * Renders the agent's in-progress streaming response.
 * Shows: thinking → tool calls → orchestration → tokens appearing in real-time.
 */
export function StreamingMessageBubble({
  streamState,
  agentUser,
  onRespondToOrchestrationStep,
}: {
  streamState: ChatStreamState
  agentUser: UserType
  onRespondToOrchestrationStep?: (
    orchestrationId: string,
    stepId: string,
    response: string
  ) => void
}) {
  const agentId = agentUser.id
  const {
    isStreaming,
    streamingTokens,
    streamingThinking,
    streamingToolCalls,
    orchestration,
  } = streamState

  if (!isStreaming && !streamingTokens && !orchestration) return null

  return (
    <li className="flex gap-2">
      <ChatAvatar
        src={agentUser.avatar}
        fallback={agentUser.name.slice(0, 2).toUpperCase()}
        status={agentUser.status}
        size={1.75}
        className="shrink-0"
      />
      <div className="flex flex-col gap-1.5 w-full max-w-sm">
        <span className="text-sm font-semibold text-foreground">
          {agentUser.name}
        </span>

        {/* Thinking section */}
        {streamingThinking && (
          <ThinkingBubble
            thinking={streamingThinking}
            isStreaming={isStreaming}
          />
        )}

        {/* Tool calls progress */}
        {streamingToolCalls.length > 0 && (
          <ToolCallProgress toolCalls={streamingToolCalls} />
        )}

        {/* Orchestration progress */}
        {orchestration && (
          <OrchestrationProgress
            orchestration={orchestration}
            onRespondToStep={onRespondToOrchestrationStep}
          />
        )}

        {/* Streaming text with markdown */}
        {streamingTokens ? (
          <div className="text-sm text-accent-foreground bg-accent rounded-lg rounded-ss-none break-words">
            <MessageBubbleContentText
              text={streamingTokens}
              isStreaming={isStreaming}
              agentId={agentId}
            />
          </div>
        ) : (
          isStreaming && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground px-2 py-1">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Processing...</span>
            </div>
          )
        )}
      </div>
    </li>
  )
}
