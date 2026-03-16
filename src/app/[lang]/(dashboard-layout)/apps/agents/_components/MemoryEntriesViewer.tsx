"use client"

import { useEffect, useState } from "react"
import {
  Brain,
  ChevronRight,
  Loader2,
  MessageSquare,
  Trash2,
  X,
} from "lucide-react"

import type { NativeMemoryEntry, NativeMemoryDetailResponse } from "@/lib/api/client"
import {
  useAgentMemoryEntries,
  useClearAgentMemoryEntries,
  useDeleteAgentMemoryEntry,
} from "@/lib/api/hooks"
import api from "@/lib/api/client"
import { toast } from "@/hooks/use-toast"

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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

// --- Helpers ---
function relativeTime(epochMs: number): string {
  const diff = (Date.now() - epochMs) / 1000
  if (diff < 60) return "ahora"
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`
  return `hace ${Math.floor(diff / 86400)}d`
}

// --- Session Card ---
function SessionCard({
  entry,
  agentId,
  onDelete,
  onViewMessages,
}: {
  entry: NativeMemoryEntry
  agentId: string
  onDelete: () => void
  onViewMessages: () => void
}) {
  return (
    <div className="group rounded-lg border p-3 hover:bg-muted/40 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onViewMessages}>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px] shrink-0">
              {entry.source}
            </Badge>
            {entry.origin && (
              <Badge variant="secondary" className="text-[10px] shrink-0">
                {entry.origin}
              </Badge>
            )}
            <span className="text-[10px] text-muted-foreground">
              {relativeTime(entry.updated_at)}
            </span>
            <span className="text-[10px] text-muted-foreground ml-auto">
              {entry.message_count} msgs
            </span>
          </div>
          {entry.text ? (
            <p className="text-sm text-muted-foreground truncate">
              {entry.text}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Sin mensajes de usuario
            </p>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={onViewMessages}
          >
            <ChevronRight className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onDelete}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// --- Messages Dialog ---
function MessagesDialog({
  open,
  onOpenChange,
  agentId,
  sessionKey,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  agentId: string
  sessionKey: string
}) {
  const [detail, setDetail] = useState<NativeMemoryDetailResponse | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch messages when dialog opens
  useEffect(() => {
    if (open && sessionKey) {
      ;(async () => {
        setLoading(true)
        try {
          const data = await api.getAgentMemoryDetail(agentId, sessionKey)
          setDetail(data)
        } catch {
          toast({ title: "Error al cargar mensajes", variant: "destructive" })
        } finally {
          setLoading(false)
        }
      })()
    } else {
      setDetail(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sessionKey])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="size-4" />
            Historial de sesion
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : detail?.messages.length ? (
          <ScrollArea className="h-[500px] pr-3">
            <div className="space-y-3">
              {detail.messages.map((msg, i) => (
                <div
                  key={i}
                  className={`rounded-lg p-3 text-sm ${
                    msg.role === "user"
                      ? "bg-primary/10 ml-8"
                      : msg.role === "assistant"
                        ? "bg-muted mr-8"
                        : "bg-muted/50 mr-8 text-xs"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px]">
                      {msg.role}
                    </Badge>
                  </div>
                  <p className="whitespace-pre-wrap break-words">
                    {msg.content.length > 1000
                      ? msg.content.slice(0, 1000) + "..."
                      : msg.content}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-8">
            Sin mensajes en esta sesion
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}

// --- Main component ---
interface MemoryEntriesViewerProps {
  agentId: string
  compact?: boolean
}

export function MemoryEntriesViewer({
  agentId,
  compact,
}: MemoryEntriesViewerProps) {
  const [deleteEntry, setDeleteEntry] = useState<NativeMemoryEntry | null>(null)
  const [showClearAll, setShowClearAll] = useState(false)
  const [viewSessionKey, setViewSessionKey] = useState<string | null>(null)

  const { data, isLoading } = useAgentMemoryEntries(agentId)
  const deleteMutation = useDeleteAgentMemoryEntry()
  const clearMutation = useClearAgentMemoryEntries()

  const entries = data?.items ?? []
  const total = data?.total ?? 0

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault() // Prevent Radix auto-close — we manage dialog state manually
    if (!deleteEntry) return
    try {
      await deleteMutation.mutateAsync({
        agentId,
        sessionKey: deleteEntry.id,
      })
      toast({ title: "Sesion eliminada" })
    } catch {
      toast({ title: "Error al eliminar", variant: "destructive" })
    } finally {
      setDeleteEntry(null)
    }
  }

  async function handleClearAll(e: React.MouseEvent) {
    e.preventDefault()
    try {
      const result = await clearMutation.mutateAsync(agentId)
      toast({
        title: "Memoria limpiada",
        description: `${result.deleted} sesiones eliminadas`,
      })
    } catch {
      toast({ title: "Error al limpiar", variant: "destructive" })
    } finally {
      setShowClearAll(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className={compact ? "pb-3" : undefined}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="size-4" />
                Memoria Nativa (OpenClaw)
              </CardTitle>
              <CardDescription>
                {total > 0
                  ? `${total} sesiones almacenadas`
                  : "Sin sesiones almacenadas"}
              </CardDescription>
            </div>
            {total > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => setShowClearAll(true)}
              >
                <Trash2 className="size-3.5 mr-1" />
                Limpiar todo
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="mx-auto size-8 text-muted-foreground mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">
                Este agente aun no tiene sesiones. Se generaran a medida que trabaje.
              </p>
            </div>
          ) : (
            <ScrollArea className={compact ? "h-[350px]" : "h-[400px]"}>
              <div className="space-y-2 pr-3">
                {entries.map((entry) => (
                  <SessionCard
                    key={entry.id}
                    entry={entry}
                    agentId={agentId}
                    onDelete={() => setDeleteEntry(entry)}
                    onViewMessages={() => setViewSessionKey(entry.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* View session messages */}
      <MessagesDialog
        open={!!viewSessionKey}
        onOpenChange={(v) => !v && setViewSessionKey(null)}
        agentId={agentId}
        sessionKey={viewSessionKey ?? ""}
      />

      {/* Delete single session */}
      <AlertDialog
        open={!!deleteEntry}
        onOpenChange={(v) => !v && setDeleteEntry(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar sesion</AlertDialogTitle>
            <AlertDialogDescription>
              El agente olvidara esta conversacion. Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="size-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="size-4 mr-2" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear all confirmation */}
      <AlertDialog open={showClearAll} onOpenChange={setShowClearAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpiar toda la memoria</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminaran permanentemente las {total} sesiones de este
              agente. Olvidara todo. Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              disabled={clearMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {clearMutation.isPending ? (
                <Loader2 className="size-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="size-4 mr-2" />
              )}
              Limpiar todo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
