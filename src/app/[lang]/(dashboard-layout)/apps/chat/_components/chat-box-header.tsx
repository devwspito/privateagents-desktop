"use client"

import type { ChatType } from "../types"

import { useChatContext } from "../_hooks/use-chat-context"
import { CardHeader } from "@/components/ui/card"
import { ChatHeaderActions } from "./chat-header-actions"
import { ChatHeaderInfo } from "./chat-header-info"
import { ChatMenuButton } from "./chat-menu-button"
import { SessionSelector } from "./session-selector"

export function ChatBoxHeader({ chat }: { chat: ChatType }) {
  const { handleSelectSession } = useChatContext()
  const isPrivateChat = chat.threadType === "private"
  const agentId = chat.agentId || (chat.id.startsWith("new:") ? chat.id.replace("new:", "") : undefined)

  return (
    <CardHeader className="flex flex-row items-center space-y-0 gap-x-1.5 py-3 border-b border-border">
      <ChatMenuButton isIcon />
      <ChatHeaderInfo chat={chat} />
      {isPrivateChat && agentId && (
        <SessionSelector
          agentId={agentId}
          currentSessionKey={chat.id}
          onSelectSession={handleSelectSession}
        />
      )}
      <ChatHeaderActions sessionKey={chat.id} chatType={chat.threadType} />
    </CardHeader>
  )
}
