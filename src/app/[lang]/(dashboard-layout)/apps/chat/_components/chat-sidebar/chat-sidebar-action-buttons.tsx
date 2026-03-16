"use client"

import { useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Bot,
  ListFilter,
  Loader2,
  MoreVertical,
  SquarePen,
} from "lucide-react"

import type { ChatType } from "../../types"
import type { LocaleType } from "@/types"

import { ensureLocalizedPathname } from "@/lib/i18n"

import { useChatContext } from "../../_hooks/use-chat-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatSidebarNotificationDropdown } from "./chat-sidebar-notification-dropdown"
import { ChatSidebarStatusDropdown } from "./chat-sidebar-status-dropdown"

type DialogStep = "type" | "agent-list"

export function ChatSidebarActionButtons() {
  const [notifications, setNotifications] = useState<string>("ALL_MESSAGES")
  const [status, setStatus] = useState<string>("ONLINE")
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [dialogStep, setDialogStep] = useState<DialogStep>("type")
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const params = useParams()
  const locale = params["lang"] as LocaleType
  const { chatState, handleNewTask, handleSelectChat } = useChatContext()

  // Get all agent chats (private + admin-view)
  const agentChats = useMemo(() => {
    return chatState.chats.filter(
      (c) => c.threadType === "private" || c.threadType === "admin-view"
    )
  }, [chatState.chats])

  const openDialog = () => {
    setDialogStep("type")
    setShowNewChatModal(true)
  }

  const closeDialog = () => {
    setShowNewChatModal(false)
    setDialogStep("type")
  }

  // Navigate to an agent's chat and start a new task
  const navigateToAgent = async (chat: ChatType) => {
    setIsLoading(true)
    try {
      handleSelectChat(chat)
      closeDialog()
      router.push(
        ensureLocalizedPathname(
          `/apps/chat/${encodeURIComponent(chat.id)}`,
          locale
        )
      )
      setTimeout(() => handleNewTask(), 100)
    } finally {
      setIsLoading(false)
    }
  }

  const getAgentInitial = (name: string) =>
    name.charAt(0).toUpperCase()

  return (
    <>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Nuevo chat"
          onClick={openDialog}
          title="Iniciar nueva conversación"
        >
          <SquarePen className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Filtrar chats">
          <ListFilter className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Mas acciones">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-40">
            <ChatSidebarNotificationDropdown
              notifications={notifications}
              setNotifications={setNotifications}
            />
            <ChatSidebarStatusDropdown status={status} setStatus={setStatus} />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* New Chat Modal */}
      <Dialog open={showNewChatModal} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-md">
          {/* Step 1: Choose conversation type */}
          {dialogStep === "type" && (
            <>
              <DialogHeader>
                <DialogTitle>Nueva Conversación</DialogTitle>
                <DialogDescription>
                  ¿Qué tipo de conversación quieres iniciar?
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3 py-4">
                <Button
                  variant="outline"
                  className="justify-start h-auto py-4 px-4"
                  onClick={() => setDialogStep("agent-list")}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="size-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Nueva Tarea</p>
                      <p className="text-sm text-muted-foreground">
                        Asignar una tarea a un agente
                      </p>
                    </div>
                  </div>
                </Button>
              </div>
            </>
          )}

          {/* Step 2a: Select agent for new task */}
          {dialogStep === "agent-list" && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => setDialogStep("type")}
                  >
                    <ArrowLeft className="size-4" />
                  </Button>
                  <div>
                    <DialogTitle>Selecciona un agente</DialogTitle>
                    <DialogDescription>
                      ¿A qué agente quieres asignar la tarea?
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <AgentList
                agents={agentChats}
                isLoading={isLoading}
                onSelect={navigateToAgent}
                getInitial={getAgentInitial}
              />
            </>
          )}

        </DialogContent>
      </Dialog>
    </>
  )
}

/** Reusable scrollable agent list */
function AgentList({
  agents,
  isLoading,
  onSelect,
  getInitial,
}: {
  agents: ChatType[]
  isLoading: boolean
  onSelect: (chat: ChatType) => void
  getInitial: (name: string) => string
}) {
  if (agents.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No hay agentes disponibles.
      </div>
    )
  }

  return (
    <ScrollArea className="max-h-72">
      <div className="flex flex-col gap-1.5 py-2">
        {agents.map((chat) => {
          const agentUser = chat.users.find((u) => u.id !== "current-user")
          return (
            <Button
              key={chat.id}
              variant="ghost"
              className="justify-start h-auto py-2.5 px-3 w-full"
              onClick={() => onSelect(chat)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : (
                <div className="flex items-center gap-3 w-full min-w-0">
                  <Avatar className="size-9 shrink-0">
                    <AvatarImage
                      src={chat.avatar || agentUser?.avatar}
                      alt={chat.name}
                    />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {getInitial(chat.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">
                      {chat.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {chat.lastMessage?.content || "Sin conversaciones"}
                    </p>
                  </div>
                </div>
              )}
            </Button>
          )
        })}
      </div>
    </ScrollArea>
  )
}
