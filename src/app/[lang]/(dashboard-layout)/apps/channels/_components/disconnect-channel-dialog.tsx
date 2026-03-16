"use client"

import { useState } from "react"
import { AlertTriangle, Loader2, PowerOff } from "lucide-react"

import type { ChannelDefinition } from "../types"

import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
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

interface DisconnectChannelDialogProps {
  channel: ChannelDefinition | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDisconnect?: (channel: ChannelDefinition) => Promise<void> | void
}

export function DisconnectChannelDialog({
  channel,
  open,
  onOpenChange,
  onDisconnect,
}: DisconnectChannelDialogProps) {
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  if (!channel) return null

  const Icon = channel.icon

  async function handleDisconnect() {
    if (!onDisconnect || !channel) return

    setIsDisconnecting(true)
    try {
      await onDisconnect(channel)
      toast({
        title: "Channel disconnected",
        description: `${channel.name} has been disconnected successfully.`,
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to disconnect",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while disconnecting the channel.",
      })
    } finally {
      setIsDisconnecting(false)
    }
  }

  function handleOpenChange(newOpen: boolean) {
    if (!isDisconnecting) {
      onOpenChange(newOpen)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg flex items-center justify-center bg-destructive/10">
              <Icon className="size-5 text-destructive" />
            </div>
            <div>
              <AlertDialogTitle>Disconnect {channel.name}</AlertDialogTitle>
              <AlertDialogDescription>
                {channel.description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertDescription>
              This will disconnect {channel.name} from your workspace. Agents
              will no longer be able to send or receive messages through this
              channel until it is reconnected.
            </AlertDescription>
          </Alert>

          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2">This action will:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Stop all message processing for this channel</li>
              <li>End any active sessions</li>
              <li>Preserve your configuration for reconnection</li>
            </ul>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDisconnecting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDisconnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Disconnecting...
              </>
            ) : (
              <>
                <PowerOff className="mr-2 h-4 w-4" />
                Disconnect
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
