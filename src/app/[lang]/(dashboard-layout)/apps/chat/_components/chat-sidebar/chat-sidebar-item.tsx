"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useRef, useState } from "react"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"

import type { LocaleType } from "@/types"
import type { ChatType } from "../../types"

import { ensureLocalizedPathname } from "@/lib/i18n"
import { cn, formatDistance, getInitials } from "@/lib/utils"
import { useDeleteSession, usePatchSession } from "@/lib/api/hooks"
import { useChatContext } from "../../_hooks/use-chat-context"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { ChatAvatar } from "../chat-avatar"

export function ChatSidebarItem({
  chat,
}: {
  chat: ChatType
}) {
  const { setIsChatSidebarOpen } = useChatContext()
  const params = useParams()

  const rawChatIdParam = params["id"]?.[0]
  const chatIdParam = rawChatIdParam
    ? decodeURIComponent(rawChatIdParam)
    : undefined
  const locale = params["lang"] as LocaleType

  const isThread = chat.threadType === "thread"

  // Thread management state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState("")
  const renameInputRef = useRef<HTMLInputElement>(null)

  const deleteSession = useDeleteSession()
  const patchSession = usePatchSession()

  const handleOnClick = () => {
    setIsChatSidebarOpen(false)
  }

  const handleStartRename = useCallback(() => {
    setRenameValue(chat.threadLabel || "")
    setIsRenaming(true)
    setTimeout(() => renameInputRef.current?.focus(), 50)
  }, [chat.threadLabel])

  const handleConfirmRename = useCallback(() => {
    const trimmed = renameValue.trim()
    if (trimmed && trimmed !== chat.threadLabel) {
      patchSession.mutate(
        { sessionKey: chat.id, data: { label: trimmed } },
      )
    }
    setIsRenaming(false)
  }, [renameValue, chat.threadLabel, chat.id, patchSession])

  const handleCancelRename = useCallback(() => {
    setIsRenaming(false)
  }, [])

  const handleDelete = useCallback(() => {
    deleteSession.mutate(
      { sessionKey: chat.id },
      {
        onSuccess: () => {
          setShowDeleteDialog(false)
        },
      }
    )
  }, [chat.id, deleteSession])

  // Get the agent name for tagging
  const agentUser = chat.users.find((u) => u.id !== "current-user")
  const agentName = agentUser?.name || "Agente"

  return (
    <>
      <div className="relative group">
        <Link
          href={ensureLocalizedPathname(
            `/apps/chat/${encodeURIComponent(chat.id)}`,
            locale
          )}
          prefetch={false}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            chatIdParam === chat.id && "bg-accent",
            "h-fit w-full"
          )}
          aria-current={chatIdParam === chat.id ? "true" : undefined}
          onClick={handleOnClick}
        >
          <li className="w-full flex items-center gap-2">
            <ChatAvatar
              src={chat.avatar}
              fallback={getInitials(chat.name)}
              status={chat.status}
              size={1.75}
              className="shrink-0"
            />
            <div className="h-11 w-full grid grid-cols-3 gap-x-4">
              <div className="col-span-2 grid">
                {isRenaming ? (
                  <Input
                    ref={renameInputRef}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleConfirmRename()
                      if (e.key === "Escape") handleCancelRename()
                    }}
                    onBlur={handleConfirmRename}
                    onClick={(e) => e.preventDefault()}
                    className="h-6 text-xs px-1"
                  />
                ) : (
                  <>
                    <span className="truncate flex items-center gap-1.5">
                      {isThread && chat.threadLabel ? (
                        <span className="truncate">{chat.threadLabel}</span>
                      ) : (
                        chat.name
                      )}
                      {isThread && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 shrink-0">
                          {agentName}
                        </Badge>
                      )}
                      {isThread && chat.isSpawned && (
                        <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 shrink-0 bg-blue-100 text-blue-700">
                          A2A
                        </Badge>
                      )}
                      {!isThread && agentUser && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                          {agentName}
                        </Badge>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold truncate">
                      {chat.lastMessage?.content || "No messages yet..."}
                    </span>
                  </>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-muted-foreground font-semibold">
                  {formatDistance(chat.lastMessage?.createdAt ?? new Date())}
                </span>
                {!!chat?.unreadCount && (
                  <Badge className="hover:bg-primary">{chat.unreadCount}</Badge>
                )}
              </div>
            </div>
          </li>
        </Link>

        {/* Context menu for threads */}
        {isThread && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={handleStartRename}>
                <Pencil className="h-3.5 w-3.5 mr-2" />
                Renombrar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Cerrar hilo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cerrar hilo</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará esta conversación con {agentName}. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cerrar hilo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
