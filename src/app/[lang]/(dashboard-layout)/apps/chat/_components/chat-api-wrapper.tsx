"use client"

import { Loader2 } from "lucide-react"

import type {
  MyAgentInfo,
} from "@/lib/api/client/types"
import type { ReactNode } from "react"
import type { ChatType } from "../types"

import { useUnifiedSidebar } from "@/lib/api/hooks"

import { ChatProvider } from "../_contexts/chat-context"
import { ChatSidebar } from "./chat-sidebar"

/**
 * Chat API Wrapper
 *
 * Fetches the unified sidebar (agent catalogue) and threads (all conversations)
 * and transforms into the format expected by the chat UI.
 *
 * Model:
 * - "Hilos": all active conversation threads (one per OpenClaw session)
 * - "Todos los Agentes": agent catalogue (click to start new thread)
 */
export function ChatApiWrapper({ children }: { children: ReactNode }) {
  const { data: sidebarData, isLoading } = useUnifiedSidebar()

  // Agent catalogue ("Todos los Agentes" section)
  const allAgents: MyAgentInfo[] = [
    ...(sidebarData?.my_agents || []),
    ...(sidebarData?.all_agents || []),
  ]
  const agentChats: ChatType[] = allAgents.map((agent: MyAgentInfo) => ({
    id: agent.session_key || `new:${agent.agent_id}`,
    lastMessage: {
      content: agent.last_message || "Iniciar conversación...",
      createdAt: agent.last_activity ? new Date(agent.last_activity) : new Date(),
    },
    name: agent.agent_name,
    avatar: agent.agent_avatar || "/images/avatars/ai-agent.svg",
    status: "ONLINE",
    messages: [],
    users: [
      {
        id: "current-user",
        name: "You",
        avatar: "/images/avatars/male-01.svg",
        status: "ONLINE",
      },
      {
        id: agent.agent_id,
        name: agent.agent_name,
        avatar: agent.agent_avatar || "/images/avatars/ai-agent.svg",
        status: "ONLINE",
      },
    ],
    typingUsers: [],
    threadType: "private" as const,
    agentId: agent.agent_id,
  }))

  const allChats = agentChats

  if (isLoading) {
    return (
      <div className="container relative w-full flex items-center justify-center p-4 min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Cargando conversaciones...
          </p>
        </div>
      </div>
    )
  }

  return (
    <ChatProvider chatsData={allChats}>
      <div className="container relative w-full flex-1 min-h-0 flex gap-x-4 p-4 overflow-hidden">
        <ChatSidebar />
        {children}
      </div>
    </ChatProvider>
  )
}
