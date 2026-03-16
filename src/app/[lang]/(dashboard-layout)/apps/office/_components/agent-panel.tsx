"use client"

import { useRouter } from "next/navigation"
import {
  Bot,
  Brain,
  Crown,
  MessageCircle,
  Settings,
  X,
  Zap,
  Activity,
  Cpu,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useAgent, useAgentSessions } from "@/lib/api/hooks"
import { QuickChatDialog } from "./quick-chat-dialog"
import { useState } from "react"

interface DepartmentInfo {
  id: string
  name: string
  display_name: string | null
  orchestrator_enabled?: boolean
  orchestrator_agent_id?: string | null
}

interface AgentPanelProps {
  agentId: string | null
  isAdmin: boolean
  lang: string
  onClose: () => void
  departments?: DepartmentInfo[]
}

export function AgentPanel({ agentId, isAdmin, lang, onClose, departments }: AgentPanelProps) {
  const router = useRouter()
  const [chatOpen, setChatOpen] = useState(false)

  const { data: agent } = useAgent(agentId || "")
  const { data: sessions } = useAgentSessions(agentId || undefined)

  const sessionCount = Array.isArray(sessions) ? sessions.length : 0

  const isOrchestrator = departments?.some(
    (d) => d.orchestrator_enabled && d.orchestrator_agent_id === agentId
  )

  const statusColor =
    agent?.status === "online" || agent?.status === "active" || agent?.status === "idle"
      ? "bg-green-500"
      : agent?.status === "busy" || agent?.status === "working"
        ? "bg-yellow-500"
        : "bg-gray-500"

  const statusLabel =
    agent?.status === "online" || agent?.status === "active" || agent?.status === "idle"
      ? "Online"
      : agent?.status === "busy" || agent?.status === "working"
        ? "Busy"
        : "Offline"

  return (
    <>
      <Sheet open={!!agentId} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="right" className="w-[380px] sm:w-[420px] p-0">
          {agent && (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-4 border-b bg-muted/30">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-6 w-6 text-primary" />
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${statusColor}`}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base">
                        {agent.display_name || agent.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px] h-5">
                          {agent.role}
                        </Badge>
                        {isOrchestrator && (
                          <Badge variant="outline" className="text-[10px] h-5 border-amber-500 text-amber-600">
                            <Crown className="h-2.5 w-2.5 mr-0.5" />
                            Orquestador
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {statusLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {agent.description && (
                  <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
                    {agent.description}
                  </p>
                )}
              </div>

              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {/* Workload */}
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Activity className="h-3 w-3" />
                      Carga de trabajo
                    </h4>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/60 transition-all"
                          style={{
                            width: `${Math.min(100, sessionCount * 20)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">
                        {sessionCount} sesiones
                      </span>
                    </div>
                  </div>

                  <Separator />

                  {/* Capabilities */}
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Zap className="h-3 w-3" />
                      Capacidades
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        <Cpu className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate">
                          {agent.model_id || "Default"}
                        </span>
                      </div>
                      {agent.thinking_level && (
                        <div className="flex items-center gap-2 text-xs">
                          <Brain className="h-3 w-3 text-muted-foreground" />
                          <span>Thinking: {agent.thinking_level}</span>
                        </div>
                      )}
                      {agent.specialization && (
                        <div className="col-span-2 text-xs text-muted-foreground">
                          Especialización: {agent.specialization}
                        </div>
                      )}
                      {agent.browser_enabled && (
                        <Badge variant="secondary" className="text-[10px] w-fit">
                          Browser
                        </Badge>
                      )}
                      {agent.heartbeat_enabled && (
                        <Badge variant="secondary" className="text-[10px] w-fit">
                          Heartbeat
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Admin-only: Security info */}
                  {isAdmin && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Settings className="h-3 w-3" />
                          Configuración (Admin)
                        </h4>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Seguridad</span>
                            <Badge variant="outline" className="text-[10px]">
                              {agent.exec_security || "full"}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Aprobación humana</span>
                            <span>{agent.requires_human_approval ? "Sí" : "No"}</span>
                          </div>
                          {agent.subagent_max_depth != null && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Sub-agentes (max depth)</span>
                              <span>{agent.subagent_max_depth}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>

              {/* Actions */}
              <div className="p-4 border-t space-y-2">
                <Button
                  className="w-full"
                  onClick={() => setChatOpen(true)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat rápido
                </Button>
                {isAdmin && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      router.push(`/${lang}/apps/agents?selected=${agent.id}`)
                    }
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Administrar
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {agent && (
        <QuickChatDialog
          open={chatOpen}
          onOpenChange={setChatOpen}
          agentId={agent.id}
          agentName={agent.display_name || agent.name}
          lang={lang}
        />
      )}
    </>
  )
}
