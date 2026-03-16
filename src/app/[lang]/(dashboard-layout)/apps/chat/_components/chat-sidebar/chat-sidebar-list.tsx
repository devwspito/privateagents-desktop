"use client"

import { useMemo, useState } from "react"

import type { ChatType } from "../../types"

import { useChatContext } from "../../_hooks/use-chat-context"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChatSidebarItem } from "./chat-sidebar-item"

interface ChatSidebarListProps {
  searchQuery: string
}

function matchesSearch(chat: ChatType, query: string): boolean {
  const q = query.toLowerCase()
  const isAtQuery = q.startsWith("@")
  const term = isAtQuery ? q.slice(1) : q

  // Match against chat name
  if (chat.name?.toLowerCase().includes(term)) return true

  // Match against thread label
  if (chat.threadLabel?.toLowerCase().includes(term)) return true

  // Match against participant/user names
  if (chat.users?.some((u) => u.name?.toLowerCase().includes(term))) return true

  // For non-@ queries, also match against last message content
  if (!isAtQuery && chat.lastMessage?.content?.toLowerCase().includes(term))
    return true

  return false
}

export function ChatSidebarList({ searchQuery }: ChatSidebarListProps) {
  const { chatState } = useChatContext()
  const [agentFilter, setAgentFilter] = useState<string>("all")

  const chats = chatState.chats

  // Threads (Hilos) — active conversations
  const threadChats = chats.filter((c) => c.threadType === "thread")
  // Agent catalogue — all agents (private + admin-view)
  const agentChats = chats.filter(
    (c) => c.threadType === "private" || c.threadType === "admin-view"
  )

  // Build unique agent list for the filter dropdown (from agent catalogue)
  const agentOptions = useMemo(() => {
    const seen = new Set<string>()
    const options: { id: string; name: string }[] = []
    for (const c of agentChats) {
      const id = c.agentId || c.users?.find((u) => u.id !== "current-user")?.id
      if (id && !seen.has(id)) {
        seen.add(id)
        options.push({ id, name: c.name })
      }
    }
    return options.sort((a, b) => a.name.localeCompare(b.name))
  }, [agentChats])

  // Apply agent filter to threads
  const agentFilteredThreads = useMemo(
    () =>
      agentFilter === "all"
        ? threadChats
        : threadChats.filter((c) => c.agentId === agentFilter || c.callerAgentId === agentFilter),
    [threadChats, agentFilter]
  )

  // Apply search filter
  const hasSearch = searchQuery.trim().length > 0
  const filteredThreads = useMemo(
    () =>
      hasSearch
        ? agentFilteredThreads.filter((c) => matchesSearch(c, searchQuery))
        : agentFilteredThreads,
    [agentFilteredThreads, searchQuery, hasSearch]
  )
  const filteredAgents = useMemo(
    () =>
      hasSearch
        ? agentChats.filter((c) => matchesSearch(c, searchQuery))
        : agentChats,
    [agentChats, searchQuery, hasSearch]
  )

  const noResults =
    hasSearch &&
    filteredThreads.length === 0 &&
    filteredAgents.length === 0

  return (
    <ScrollArea className="flex-1 min-h-0">
      <div className="p-3 space-y-4">
        {/* Hilos — Active conversation threads (only shown if there are threads) */}
        {threadChats.length > 0 && (
          <section>
            <div className="flex items-center justify-between px-2 pb-1.5">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Hilos
              </h3>
              {agentOptions.length > 1 && (
                <Select value={agentFilter} onValueChange={setAgentFilter}>
                  <SelectTrigger className="h-5 w-auto min-w-[80px] text-[10px] border-0 bg-transparent px-1 gap-1 focus:ring-0">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="all" className="text-xs">
                      Todos
                    </SelectItem>
                    {agentOptions.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id} className="text-xs">
                        {opt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {filteredThreads.length > 0 ? (
              <ul className="space-y-1.5">
                {filteredThreads.map((c) => (
                  <ChatSidebarItem key={c.id} chat={c} />
                ))}
              </ul>
            ) : (
              <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                Sin resultados
              </div>
            )}
          </section>
        )}

        {/* Todos los Agentes — Agent catalogue */}
        {filteredAgents.length > 0 && (
          <section>
            <h3 className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Todos los Agentes
            </h3>
            <ul className="space-y-1.5">
              {filteredAgents.map((c) => (
                <ChatSidebarItem key={c.id} chat={c} />
              ))}
            </ul>
          </section>
        )}

        {/* No search results */}
        {noResults && (
          <div className="px-2 py-8 text-center text-sm text-muted-foreground">
            No se encontraron resultados para &ldquo;{searchQuery}&rdquo;
          </div>
        )}

        {/* Empty state — no agents at all */}
        {!hasSearch && agentChats.length === 0 && threadChats.length === 0 && (
          <div className="px-2 py-8 text-center text-sm text-muted-foreground">
            No tienes agentes asignados.
            <br />
            Contacta al administrador.
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
