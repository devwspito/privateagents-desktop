"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import { AlertTriangle, Check, Loader2, Send, Square, X } from "lucide-react"

import type {
  ApprovalEvent,
  ToolCallEvent,
} from "@/app/[lang]/(dashboard-layout)/apps/chat/_hooks/use-chat-stream"

import { useChatStream } from "@/app/[lang]/(dashboard-layout)/apps/chat/_hooks/use-chat-stream"
import { fetchWithAuth } from "@/lib/fetch-with-auth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

import { API_BASE } from "@/lib/api-config"

// Human-readable labels for approval actions
const ACTION_LABELS: Record<string, { label: string; verb: string }> = {
  gmail_send_email: { label: "Send Email", verb: "Send" },
  gmail_reply_to_thread: { label: "Reply to Email", verb: "Reply" },
  googledrive_delete_file: { label: "Delete File", verb: "Delete" },
  googledrive_add_file_sharing: { label: "Share File", verb: "Share" },
  slack_send_message: { label: "Send Slack Message", verb: "Send" },
  whatsapp_send: { label: "Send WhatsApp Message", verb: "Send" },
}

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: Date
}

export function RemoteChat({
  agentId,
  desktopConnected,
}: {
  agentId: string | null
  desktopConnected: boolean
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [sessionKey, setSessionKey] = useState<string | undefined>()
  const [streamingContent, setStreamingContent] = useState("")
  const [streamingApproval, setStreamingApproval] =
    useState<ApprovalEvent | null>(null)
  const [activeTools, setActiveTools] = useState<ToolCallEvent[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const chatStream = useChatStream()

  // Auto-scroll on new content
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamingContent, streamingApproval])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || chatStream.isStreaming) return

    setInput("")
    setStreamingContent("")
    setActiveTools([])
    setStreamingApproval(null)

    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])

    await chatStream.sendMessage(
      {
        message: text,
        session_key: sessionKey,
        agent_id: agentId || undefined,
      },
      {
        onToken: (accumulated) => {
          setStreamingContent(accumulated)
        },
        onToolCall: (toolCall) => {
          setActiveTools((prev) => [...prev, toolCall])
        },
        onApproval: (approval) => {
          setStreamingApproval(approval)
        },
        onSessionCreated: (key) => {
          setSessionKey(key)
        },
        onDone: (_messageId, _sk, finalTokens) => {
          if (finalTokens) {
            const agentMsg: ChatMessage = {
              id: `agent-${Date.now()}`,
              role: "assistant",
              content: finalTokens,
              createdAt: new Date(),
            }
            setMessages((prev) => [...prev, agentMsg])
          }
          setStreamingContent("")
          setActiveTools([])
        },
        onError: (error) => {
          const errMsg: ChatMessage = {
            id: `err-${Date.now()}`,
            role: "assistant",
            content: `Error: ${error}`,
            createdAt: new Date(),
          }
          setMessages((prev) => [...prev, errMsg])
          setStreamingContent("")
        },
      }
    )
  }, [input, sessionKey, agentId, chatStream])

  const handleApproval = useCallback(
    async (approved: boolean) => {
      if (!streamingApproval) return

      const action = streamingApproval.action
      const approvalId = streamingApproval.approval_id

      // Call formal approval API
      if (approvalId) {
        try {
          await fetchWithAuth(`${API_BASE}/chat/approve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              approval_id: approvalId,
              approved,
              session_key: sessionKey,
            }),
          })
        } catch {
          // Best effort
        }
      }

      setStreamingApproval(null)

      // Send follow-up message
      const responseText = approved
        ? `Approved: execute ${action}`
        : `Cancelled: do not execute ${action}`

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: responseText,
        createdAt: new Date(),
      }
      setMessages((prev) => [...prev, userMsg])
      setStreamingContent("")

      await chatStream.sendMessage(
        {
          message: responseText,
          session_key: sessionKey,
          agent_id: agentId || undefined,
        },
        {
          onToken: (accumulated) => {
            setStreamingContent(accumulated)
          },
          onToolCall: (toolCall) => {
            setActiveTools((prev) => [...prev, toolCall])
          },
          onApproval: (approval) => {
            setStreamingApproval(approval)
          },
          onDone: (_messageId, _sk, finalTokens) => {
            if (finalTokens) {
              const agentMsg: ChatMessage = {
                id: `agent-${Date.now()}`,
                role: "assistant",
                content: finalTokens,
                createdAt: new Date(),
              }
              setMessages((prev) => [...prev, agentMsg])
            }
            setStreamingContent("")
            setActiveTools([])
          },
          onError: (error) => {
            const errMsg: ChatMessage = {
              id: `err-${Date.now()}`,
              role: "assistant",
              content: `Error: ${error}`,
              createdAt: new Date(),
            }
            setMessages((prev) => [...prev, errMsg])
            setStreamingContent("")
          },
        }
      )
    },
    [streamingApproval, sessionKey, agentId, chatStream]
  )

  const handleAbort = useCallback(() => {
    chatStream.abort(sessionKey)
    setStreamingContent("")
    setActiveTools([])
  }, [chatStream, sessionKey])

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
      >
        {messages.length === 0 && !chatStream.isStreaming && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <p className="text-sm">Envia un mensaje para comenzar</p>
            {!desktopConnected && (
              <p className="text-xs text-amber-500">
                Desktop no conectado — el agente no puede ejecutar herramientas
                locales
              </p>
            )}
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Streaming content */}
        {streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-lg bg-muted px-3 py-2 text-sm prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{streamingContent}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Active tool calls */}
        {activeTools.length > 0 && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground space-y-1">
              {activeTools.map((tc, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>{tc.tool_name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approval card */}
        {streamingApproval && (
          <div className="flex justify-start">
            <InlineApprovalCard
              approval={streamingApproval}
              onApprove={() => handleApproval(true)}
              onReject={() => handleApproval(false)}
            />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t px-4 py-3">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex gap-2"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe un mensaje..."
            disabled={chatStream.isStreaming && !streamingApproval}
            className="flex-1"
            autoFocus
          />
          {chatStream.isStreaming && !streamingApproval ? (
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={handleAbort}
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={
                !input.trim() || (chatStream.isStreaming && !streamingApproval)
              }
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </form>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user"

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted prose prose-sm dark:prose-invert max-w-none"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <ReactMarkdown>{message.content}</ReactMarkdown>
        )}
      </div>
    </div>
  )
}

function InlineApprovalCard({
  approval,
  onApprove,
  onReject,
}: {
  approval: ApprovalEvent
  onApprove: () => void
  onReject: () => void
}) {
  const key = approval.action.toLowerCase()
  const { label } = ACTION_LABELS[key] || {
    label: approval.action,
    verb: "Execute",
  }

  return (
    <Card className="w-full max-w-[300px] border-amber-500/50 bg-amber-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span>Accion ejecutada</span>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {label} — Aprobar o revertir?
        </p>
      </CardHeader>

      {approval.preview && (
        <CardContent className="pb-3">
          <div className="rounded-md bg-muted p-2 text-xs whitespace-pre-wrap max-h-32 overflow-y-auto">
            {approval.preview}
          </div>
        </CardContent>
      )}

      <CardFooter className="gap-2 pt-0">
        <Button size="sm" onClick={onApprove} className="gap-1.5">
          <Check className="h-3.5 w-3.5" />
          Aprobar
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={onReject}
          className="gap-1.5"
        >
          <X className="h-3.5 w-3.5" />
          Revertir
        </Button>
      </CardFooter>
    </Card>
  )
}
