"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Bot, Send, Loader2, ExternalLink, User, RefreshCw, Cpu, Brain, Wrench, Shield, Plug } from "lucide-react"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useQuickChat } from "../_hooks/use-quick-chat"
import { useAgent } from "@/lib/api/react-hooks/agent"
import { useEffectiveConnections } from "@/lib/api/react-hooks/integration"

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface QuickChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agentId: string
  agentName: string
  lang: string
}

// ---------------------------------------------------------------------------
// Component — pure UI, all logic lives in useQuickChat
// ---------------------------------------------------------------------------

export function QuickChatDialog({
  open,
  onOpenChange,
  agentId,
  agentName,
  lang,
}: QuickChatDialogProps) {
  const router = useRouter()
  const [input, setInput] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const navigatingRef = useRef(false)

  const chat = useQuickChat({ agentId })
  const { data: agent } = useAgent(agentId)
  const { data: effectiveConns } = useEffectiveConnections(
    agentId,
    agent?.enterprise_id || null
  )

  // Auto-scroll on new content — target Radix ScrollArea's Viewport
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector(
      '[data-slot="scroll-area-viewport"]'
    )
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight
    }
  }, [chat.messages, chat.streamTokens])

  // Focus input when opened / cleanup on close
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      if (!navigatingRef.current) chat.reset()
      navigatingRef.current = false
      setInput("")
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const autoResize = useCallback(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [])

  useEffect(() => { autoResize() }, [input, autoResize])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text) return
    setInput("")
    if (inputRef.current) inputRef.current.style.height = "auto"
    chat.send(text)
  }, [input, chat])

  // Enter = new line (default textarea behavior). Send only via button.
  const handleKeyDown = useCallback(
    (_e: React.KeyboardEvent) => {
      // No special keyboard handling — Enter creates new lines
    },
    []
  )

  const openFullChat = useCallback(() => {
    navigatingRef.current = true
    const target = chat.sessionKey
      ? `/${lang}/apps/chat/${encodeURIComponent(chat.sessionKey)}`
      : `/${lang}/apps/chat/${encodeURIComponent(`new:${agentId}`)}`
    router.push(target)
    setTimeout(() => onOpenChange(false), 50)
  }, [chat.sessionKey, agentId, lang, router, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 max-h-[80vh] flex flex-col">
        <Tabs defaultValue="chat" className="flex flex-col h-full">
          {/* Header with tabs */}
          <div className="px-4 pt-3 pb-0 border-b">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{agentName}</h3>
                  <p className="text-[10px] text-muted-foreground">
                    {agent?.status === "online" ? "En línea" : agent?.status || ""}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={openFullChat}
                className="text-xs gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Abrir chat completo
              </Button>
            </div>
            <TabsList className="w-full grid grid-cols-2 h-8 mb-2">
              <TabsTrigger value="chat" className="text-xs">Chat</TabsTrigger>
              <TabsTrigger value="info" className="text-xs">Info</TabsTrigger>
            </TabsList>
          </div>

          {/* Chat Tab */}
          <TabsContent value="chat" className="flex-1 flex flex-col mt-0 min-h-0 data-[state=inactive]:hidden">
            <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-[300px] max-h-[50vh]">
              <div className="p-4 space-y-3">
                {chat.messages.length === 0 && !chat.isStreaming && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Escribe un mensaje para comenzar
                  </div>
                )}

                {chat.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="h-3 w-3 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 text-sm overflow-hidden ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : msg.isError
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted"
                      }`}
                    >
                      <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{msg.text}</p>
                      {msg.isError && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={chat.retry}
                          className="mt-1 text-xs h-6 px-2"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Reintentar
                        </Button>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Streaming response */}
                {chat.isStreaming && (
                  <div className="flex gap-2 justify-start">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="h-3 w-3 text-primary" />
                    </div>
                    <div className="max-w-[80%] rounded-lg px-3 py-2 text-sm bg-muted overflow-hidden">
                      {chat.streamThinking && (
                        <p className="text-xs text-muted-foreground italic mb-1">
                          Pensando...
                        </p>
                      )}
                      {chat.streamTokens ? (
                        <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">
                          {chat.streamTokens}
                        </p>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span className="text-xs text-muted-foreground">
                            {chat.streamToolCalls.length > 0
                              ? `Ejecutando: ${chat.streamToolCalls[chat.streamToolCalls.length - 1]?.tool_name}`
                              : "Procesando..."}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t p-3 flex gap-2 items-end">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe un mensaje..."
                disabled={chat.isStreaming}
                className="flex-1 min-h-[36px] max-h-[200px] resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || chat.isStreaming}
              >
                {chat.isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Info Tab */}
          <TabsContent value="info" className="flex-1 mt-0 min-h-0 data-[state=inactive]:hidden">
            <ScrollArea className="h-[400px]">
              <div className="p-4 space-y-4">
                {agent ? (
                  <>
                    {/* Role & Description */}
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-1">Rol</h4>
                      <p className="text-sm capitalize">{agent.role}</p>
                    </div>
                    {agent.description && (
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground mb-1">Descripción</h4>
                        <p className="text-sm">{agent.description}</p>
                      </div>
                    )}
                    {agent.specialization && (
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground mb-1">Especialización</h4>
                        <p className="text-sm">{agent.specialization}</p>
                      </div>
                    )}

                    {/* Integrations */}
                    {effectiveConns && effectiveConns.connections.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Plug className="h-3.5 w-3.5 text-muted-foreground" />
                          <h4 className="text-xs font-medium text-muted-foreground">Integraciones</h4>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {effectiveConns.connections.map((conn) => (
                            <Badge
                              key={conn.id}
                              variant={conn.status === "active" ? "default" : "secondary"}
                              className="text-[10px]"
                            >
                              {(conn.app_name || conn.app || "").replace(/_/g, " ")}
                              <span className="ml-1 opacity-60 text-[8px]">
                                {conn.scope === "enterprise" ? "Ent" : conn.scope === "department" ? "Dept" : "Agent"}
                              </span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Model */}
                    <div className="flex items-center gap-2">
                      <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Modelo:</span>
                      <Badge variant="secondary" className="text-xs">
                        {agent.model_id}
                      </Badge>
                    </div>

                    {/* Thinking Level */}
                    {agent.thinking_level && (
                      <div className="flex items-center gap-2">
                        <Brain className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Pensamiento:</span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {agent.thinking_level}
                        </Badge>
                      </div>
                    )}

                    {/* Capabilities */}
                    {agent.capabilities && agent.capabilities.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                          <h4 className="text-xs font-medium text-muted-foreground">Habilidades</h4>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {agent.capabilities.map((cap) => (
                            <Badge key={cap} variant="outline" className="text-[10px]">
                              {cap}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tools */}
                    {agent.can_use_tools && agent.can_use_tools.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                          <h4 className="text-xs font-medium text-muted-foreground">Herramientas</h4>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {agent.can_use_tools.slice(0, 15).map((tool) => (
                            <Badge key={tool} variant="secondary" className="text-[10px]">
                              {tool}
                            </Badge>
                          ))}
                          {agent.can_use_tools.length > 15 && (
                            <Badge variant="secondary" className="text-[10px]">
                              +{agent.can_use_tools.length - 15} más
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Status badges */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Badge
                        variant={agent.status === "online" ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {agent.status}
                      </Badge>
                      {agent.browser_enabled && (
                        <Badge variant="outline" className="text-[10px]">Browser</Badge>
                      )}
                      {agent.heartbeat_enabled && (
                        <Badge variant="outline" className="text-[10px]">Heartbeat</Badge>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Cargando información...
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
