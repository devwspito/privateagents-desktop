"use client"

import { useState } from "react"
import { Brain, EllipsisVertical, MessageSquarePlus, Trash2 } from "lucide-react"

import { useChatContext } from "../_hooks/use-chat-context"
import { toast } from "@/hooks/use-toast"
import { useClearConversation } from "@/lib/api/hooks"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ConfirmDeleteDialog } from "./confirm-delete-dialog"
import { MemoryDrawer } from "./memory-drawer"

interface ChatHeaderActionsProps {
  sessionKey?: string
  chatType?: "private" | "admin-view" | "thread"
}

export function ChatHeaderActions({ sessionKey, chatType }: ChatHeaderActionsProps) {
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [showMemory, setShowMemory] = useState(false)
  const clearMutation = useClearConversation()
  const { handleNewTask, chatState } = useChatContext()

  const isPrivate = chatType === "private"

  const selectedChat = chatState.selectedChat
  const agentId = selectedChat?.agentId
    || selectedChat?.users.find((u) => u.id !== "current-user")?.id
  const agentName = selectedChat?.name

  async function handleClear() {
    if (!sessionKey) return
    await clearMutation.mutateAsync(sessionKey)
    toast({
      title: "Conversación limpiada",
      description: "Se han eliminado todos los mensajes.",
    })
  }

  return (
    <>
      <div className="flex gap-1 ms-auto">
        {isPrivate && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNewTask}
                aria-label="Nueva conversación"
              >
                <MessageSquarePlus className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Nueva conversación</TooltipContent>
          </Tooltip>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger className="self-center" asChild>
            <Button variant="ghost" size="icon" aria-label="More actions">
              <EllipsisVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Search</DropdownMenuItem>
            {agentId && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowMemory(true)}>
                  <Brain className="size-4 mr-2" />
                  Memoria del agente
                </DropdownMenuItem>
              </>
            )}
            {sessionKey && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setShowClearDialog(true)}
                >
                  <Trash2 className="size-4 mr-2" />
                  Limpiar conversación
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmDeleteDialog
        open={showClearDialog}
        onOpenChange={setShowClearDialog}
        title="Limpiar conversación"
        description="Se borrarán todos los mensajes de esta conversación."
        onConfirm={handleClear}
      />

      {agentId && (
        <MemoryDrawer
          open={showMemory}
          onOpenChange={setShowMemory}
          agentId={agentId}
          agentName={agentName}
        />
      )}
    </>
  )
}
