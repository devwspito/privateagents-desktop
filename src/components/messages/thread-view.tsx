"use client"

import { useMemo } from "react"
import { Send } from "lucide-react"

import type { ComponentProps, FormEvent, ReactNode } from "react"

import { cn, formatTime, getInitials } from "@/lib/utils"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

export interface ThreadMessage {
  id: string
  senderId: string
  sender?: {
    id: string
    name: string
    avatar?: string
  }
  content: ReactNode
  timestamp: Date | string
  status?: "SENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED"
}

export interface ThreadParticipant {
  id: string
  name: string
  avatar?: string
}

export interface ThreadViewProps extends ComponentProps<typeof Card> {
  messages: ThreadMessage[]
  currentUserId: string
  participants?: ThreadParticipant[]
  threadName?: string
  threadAvatar?: string
  headerActions?: ReactNode
  onSendMessage?: (message: string) => void
  emptyMessage?: ReactNode
  showInput?: boolean
  inputPlaceholder?: string
}

function formatMessageTime(timestamp: Date | string): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp
  return formatTime(date)
}

function groupMessagesByDate(
  messages: ThreadMessage[]
): Map<string, ThreadMessage[]> {
  const groups = new Map<string, ThreadMessage[]>()

  const sortedMessages = [...messages].sort((a, b) => {
    const dateA =
      typeof a.timestamp === "string" ? new Date(a.timestamp) : a.timestamp
    const dateB =
      typeof b.timestamp === "string" ? new Date(b.timestamp) : b.timestamp
    return dateA.getTime() - dateB.getTime()
  })

  for (const message of sortedMessages) {
    const date =
      typeof message.timestamp === "string"
        ? new Date(message.timestamp)
        : message.timestamp
    const dateKey = date.toDateString()

    if (!groups.has(dateKey)) {
      groups.set(dateKey, [])
    }
    groups.get(dateKey)!.push(message)
  }

  return groups
}

function formatDateSeparator(date: Date): string {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return "Today"
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday"
  }

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  })
}

export function ThreadView({
  messages,
  currentUserId,
  participants = [],
  threadName,
  threadAvatar,
  headerActions,
  onSendMessage,
  emptyMessage,
  showInput = true,
  inputPlaceholder = "Type a message...",
  className,
  children,
  ...props
}: ThreadViewProps) {
  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      const dateA =
        typeof a.timestamp === "string" ? new Date(a.timestamp) : a.timestamp
      const dateB =
        typeof b.timestamp === "string" ? new Date(b.timestamp) : b.timestamp
      return dateA.getTime() - dateB.getTime()
    })
  }, [messages])

  const groupedMessages = useMemo(() => {
    return groupMessagesByDate(messages)
  }, [messages])

  const handleSendMessage = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const message = formData.get("message") as string

    if (message.trim() && onSendMessage) {
      onSendMessage(message.trim())
      ;(e.target as HTMLFormElement).reset()
    }
  }

  const participantCount = participants.length || 0

  return (
    <Card
      data-slot="thread-view"
      className={cn("flex flex-col h-full", className)}
      {...props}
    >
      {(threadName || headerActions) && (
        <CardHeader className="flex flex-row items-center gap-3 p-3 border-b border-border space-y-0">
          {threadAvatar && (
            <Avatar>
              <AvatarImage src={threadAvatar} alt={threadName || "Thread"} />
              <AvatarFallback>
                {threadName ? getInitials(threadName) : "T"}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="flex-1 min-w-0">
            {threadName && (
              <h3 className="text-base font-semibold truncate">{threadName}</h3>
            )}
            {participantCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {participantCount} participant
                {participantCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          {headerActions && (
            <div className="flex items-center gap-1">{headerActions}</div>
          )}
        </CardHeader>
      )}

      <ScrollArea className="flex-1 min-h-0">
        <CardContent className="flex flex-col gap-3 p-4">
          {sortedMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[200px] text-muted-foreground">
              {emptyMessage || <p>No messages yet</p>}
            </div>
          ) : (
            Array.from(groupedMessages.entries()).map(
              ([dateKey, dateMessages]) => (
                <div key={dateKey} className="flex flex-col gap-3">
                  <div className="flex items-center justify-center">
                    <span className="text-xs text-muted-foreground bg-background px-3 py-1 rounded-full border border-border">
                      {formatDateSeparator(new Date(dateKey))}
                    </span>
                  </div>
                  {dateMessages.map((message) => {
                    const isCurrentUser = message.senderId === currentUserId
                    const sender =
                      message.sender ||
                      participants.find((p) => p.id === message.senderId)

                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-2",
                          isCurrentUser ? "justify-end" : "justify-start"
                        )}
                      >
                        {!isCurrentUser && sender && (
                          <Avatar className="h-8 w-8 shrink-0 mt-1">
                            <AvatarImage
                              src={sender.avatar}
                              alt={sender.name}
                            />
                            <AvatarFallback className="text-xs">
                              {getInitials(sender.name)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={cn(
                            "max-w-[75%] rounded-2xl px-3 py-2",
                            isCurrentUser
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-muted rounded-bl-md"
                          )}
                        >
                          {!isCurrentUser && sender && (
                            <span className="text-xs font-medium opacity-70 block mb-1">
                              {sender.name}
                            </span>
                          )}
                          <div className="text-sm leading-relaxed">
                            {message.content}
                          </div>
                          <div className="flex items-center justify-end gap-2 mt-1">
                            <span
                              className={cn(
                                "text-xs",
                                isCurrentUser
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              )}
                            >
                              {formatMessageTime(message.timestamp)}
                            </span>
                          </div>
                        </div>
                        {isCurrentUser && sender && (
                          <Avatar className="h-8 w-8 shrink-0 mt-1">
                            <AvatarImage
                              src={sender.avatar}
                              alt={sender.name}
                            />
                            <AvatarFallback className="text-xs">
                              {getInitials(sender.name)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            )
          )}
          {children}
        </CardContent>
      </ScrollArea>

      {showInput && (
        <CardFooter className="p-3 border-t border-border">
          <form
            className="flex items-center gap-2 w-full"
            onSubmit={handleSendMessage}
          >
            <Input
              type="text"
              name="message"
              placeholder={inputPlaceholder}
              className="flex-1"
              autoComplete="off"
            />
            <Button type="submit" size="icon" aria-label="Send message">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardFooter>
      )}
    </Card>
  )
}
