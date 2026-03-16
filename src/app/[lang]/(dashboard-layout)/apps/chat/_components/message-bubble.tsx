import { memo } from "react"
import { format } from "date-fns"
import { EllipsisVertical } from "lucide-react"

import type { MessageType, UserType } from "../types"

import { cn, getInitials } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChatAvatar } from "./chat-avatar"
import { MessageBubbleContent } from "./message-bubble-content"
import { MessageBubbleStatusIcon } from "./message-bubble-status-icon"

function formatMessageTime(date: Date | string): string {
  try {
    const d = typeof date === "string" ? new Date(date) : date
    if (isNaN(d.getTime())) return ""
    return format(d, "HH:mm")
  } catch {
    return ""
  }
}

export const MessageBubble = memo(function MessageBubble({
  sender,
  message,
  isByCurrentUser,
  alwaysShowName = false,
  agentId,
}: {
  sender: UserType
  message: MessageType
  isByCurrentUser: boolean
  alwaysShowName?: boolean
  agentId?: string
}) {
  const timeStr = formatMessageTime(message.createdAt)

  return (
    <li
      className={cn("flex gap-2 group overflow-hidden", isByCurrentUser && "flex-row-reverse")}
      style={{ contain: "inline-size" }}
    >
      <ChatAvatar
        src={sender.avatar}
        fallback={getInitials(sender.name)}
        status={sender.status}
        size={1.75}
        className="shrink-0"
      />

      <div
        className={cn(
          "flex flex-col gap-0.5 max-w-[80%] min-w-0",
          isByCurrentUser && "items-end"
        )}
      >
        {(!isByCurrentUser || alwaysShowName) && (
          <span className="text-xs font-medium text-muted-foreground ml-2">
            {sender.name}
          </span>
        )}

        <div
          className="max-w-full min-w-0 overflow-hidden"
          style={{ overflowWrap: "anywhere" }}
        >
          <MessageBubbleContent
            message={message}
            isByCurrentUser={isByCurrentUser}
            agentId={agentId}
          />

          <div
            className={cn(
              "flex items-center justify-end gap-1.5 mt-1 px-3 pb-1",
              isByCurrentUser
                ? "text-primary-foreground/70"
                : "text-muted-foreground"
            )}
          >
            <span className="text-[10px]">{timeStr}</span>
            {isByCurrentUser && (
              <MessageBubbleStatusIcon status={message.status} />
            )}
          </div>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          className="opacity-0 group-hover:opacity-100 transition-opacity self-start mt-2"
          asChild
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            aria-label="More actions"
          >
            <EllipsisVertical className="size-3 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={isByCurrentUser ? "start" : "end"}>
          <DropdownMenuItem>Reply</DropdownMenuItem>
          <DropdownMenuItem>Copy</DropdownMenuItem>
          <DropdownMenuItem>Forward</DropdownMenuItem>
          <DropdownMenuSeparator />
          {!isByCurrentUser && (
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              Report
            </DropdownMenuItem>
          )}
          {isByCurrentUser && (
            <>
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
})
