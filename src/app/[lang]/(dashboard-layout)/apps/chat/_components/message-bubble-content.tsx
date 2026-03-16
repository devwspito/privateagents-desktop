import type { ReactNode } from "react"
import type { MessageType } from "../types"

import { cn } from "@/lib/utils"

import { MessageBubbleContentFiles } from "./message-bubble-content-files"
import { MessageBubbleContentImages } from "./message-bubble-content-images"
import { MessageBubbleContentText } from "./message-bubble-content-text"

export function MessageBubbleContent({
  message,
  isByCurrentUser,
  agentId,
}: {
  message: MessageType
  isByCurrentUser: boolean
  agentId?: string
}) {
  let content: ReactNode

  // Handle different types of message content
  if (message.text) {
    content = <MessageBubbleContentText text={message.text} isByCurrentUser={isByCurrentUser} agentId={agentId} />
  } else if (message.images) {
    content = <MessageBubbleContentImages images={message.images} />
  } else if (message.files) {
    content = (
      <MessageBubbleContentFiles
        files={message.files}
        isByCurrentUser={isByCurrentUser}
      />
    )
  } else if (message.voiceMessage) {
    content = <audio controls src={message.voiceMessage.url} />
  }

  // Don't render empty bubbles (tool/system messages with no displayable content)
  if (!content) return null

  return (
    <div
      className={cn(
        "text-sm space-y-2 rounded-2xl px-3 py-2",
        "max-w-full min-w-0 overflow-hidden",
        "break-words",
        isByCurrentUser
          ? "bg-primary text-primary-foreground rounded-tr-md"
          : "bg-muted text-foreground rounded-tl-md"
      )}
      style={{ overflowWrap: "anywhere" }}
    >
      {content}
    </div>
  )
}
