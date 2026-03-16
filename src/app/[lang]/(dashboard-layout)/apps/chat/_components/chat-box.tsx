"use client"

import { useMemo } from "react"
import { useParams } from "next/navigation"

import type { UserType } from "../types"

import { useChatContext } from "../_hooks/use-chat-context"
import { Card } from "@/components/ui/card"
import { ChatBoxContent } from "./chat-box-content"
import { ChatBoxFooter } from "./chat-box-footer"
import { ChatBoxHeader } from "./chat-box-header"
import { ChatBoxNotFound } from "./chat-box-not-found"

export function ChatBox({ user }: { user: UserType }) {
  const { chatState } = useChatContext()
  const params = useParams()

  const rawChatIdParam = params["id"]?.[0] // Get the chat ID from route params (URL-encoded)
  const chatIdParam = rawChatIdParam
    ? decodeURIComponent(rawChatIdParam)
    : undefined

  const chat = useMemo(() => {
    if (chatIdParam) {
      // Find the chat by ID (decoded session_key)
      return chatState.chats.find((c) => c.id === chatIdParam)
    }

    // Return null if not found
    return null
  }, [chatState.chats, chatIdParam])

  // Fallback: during session creation, router.replace() is async so the URL
  // may still have the old ID while chatState already has the new one.
  // Use selectedChat as fallback to avoid a flash of "No chat found".
  const activeChat = chat ?? chatState.selectedChat

  // If chat ID exists but no matching chat is found, show a not found UI
  if (!activeChat) return <ChatBoxNotFound />

  return (
    <Card className="grow flex flex-col min-h-0">
      <ChatBoxHeader chat={activeChat} />
      <ChatBoxContent user={user} chat={activeChat} />
      <ChatBoxFooter />
    </Card>
  )
}
