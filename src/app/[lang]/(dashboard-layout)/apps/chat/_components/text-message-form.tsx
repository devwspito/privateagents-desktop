"use client"

import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Send, Square } from "lucide-react"

import { useAvailableAgentsForChat } from "@/lib/api/hooks"

import { useChatContext } from "../_hooks/use-chat-context"
import { Button, ButtonLoading } from "@/components/ui/button"
import { EmojiPicker } from "@/components/ui/emoji-picker"
import { MentionInput } from "./mention-input"

const MAX_MESSAGE_LENGTH = 2000

export function TextMessageForm() {
  const { handleAddTextMessage, handleAbortStream, streamState } =
    useChatContext()
  const { data: agentsData } = useAvailableAgentsForChat()
  const searchParams = useSearchParams()
  const [text, setText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Pre-fill @mention from URL param
  useEffect(() => {
    const mention = searchParams.get("mention")
    if (mention && !text) {
      setText(`@${mention} `)
    }
    // Only run on mount or when mention param changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const trimmed = text.trim()
  const isValid = trimmed.length > 0 && trimmed.length <= MAX_MESSAGE_LENGTH
  const isDisabled = isSubmitting || !isValid || streamState.isStreaming

  const handleSubmit = useCallback(async () => {
    if (!isValid || isSubmitting || streamState.isStreaming) return
    setIsSubmitting(true)
    try {
      await handleAddTextMessage(trimmed)
      setText("")
    } finally {
      setIsSubmitting(false)
    }
  }, [
    isValid,
    isSubmitting,
    streamState.isStreaming,
    handleAddTextMessage,
    trimmed,
  ])

  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      handleSubmit()
    },
    [handleSubmit]
  )

  return (
    <form
      onSubmit={handleFormSubmit}
      className="w-full flex justify-center items-center gap-1.5"
    >
      <EmojiPicker
        onEmojiClick={(e) => {
          setText((prev) => prev + e.emoji)
        }}
      />

      <MentionInput
        value={text}
        onChange={setText}
        onSubmit={handleSubmit}
        placeholder={
          streamState.isStreaming
            ? "Agent is responding..."
            : "Type a message... (use @ to mention agents)"
        }
        disabled={streamState.isStreaming}
        agents={agentsData?.agents ?? []}
        className="bg-accent"
      />

      {streamState.isStreaming ? (
        <Button
          type="button"
          size="icon"
          variant="destructive"
          onClick={handleAbortStream}
          aria-label="Stop generation"
        >
          <Square className="h-4 w-4" />
        </Button>
      ) : (
        <ButtonLoading
          isLoading={isSubmitting}
          disabled={isDisabled}
          size="icon"
          icon={Send}
          iconClassName="me-0"
          loadingIconClassName="me-0"
        />
      )}
    </form>
  )
}
