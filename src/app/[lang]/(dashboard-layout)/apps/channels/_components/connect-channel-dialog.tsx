"use client"

import { useEffect, useState } from "react"
import { Loader2, QrCode, RefreshCw, Smartphone, Timer } from "lucide-react"

import type { ChannelDefinition } from "../types"

import { useChannelQR } from "@/lib/api/hooks"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { QRCodeSVG } from "qrcode.react"

interface ConnectChannelDialogProps {
  channel: ChannelDefinition | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConnect?: (channel: ChannelDefinition) => Promise<void> | void
}

function isQRAuthType(auth: string): boolean {
  return auth === "qr_code" || auth === "link_device"
}

function QRCodeDisplay({
  channelId,
  channelName,
  channelColor,
}: {
  channelId: string
  channelName: string
  channelColor: string
}) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const { data, isLoading, error, refetch } = useChannelQR(channelId)

  useEffect(() => {
    if (data?.expires_in) {
      setTimeLeft(data.expires_in)
    }
  }, [data?.expires_in])

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  useEffect(() => {
    if (timeLeft === 0 && data?.expires_in) {
      refetch()
    }
  }, [timeLeft, data?.expires_in, refetch])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center py-6 space-y-4">
        <div className="size-64 bg-muted rounded-lg flex items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Generating QR code...</p>
      </div>
    )
  }

  if (error || !data?.qr_data) {
    return (
      <div className="flex flex-col items-center py-6 space-y-4">
        <div className="size-64 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
          <div className="text-center text-muted-foreground">
            <QrCode className="size-16 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Unable to generate QR code</p>
            <p className="text-xs">Gateway not connected</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 size-4" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center py-6 space-y-4">
      <div className="relative">
        <div
          className="size-64 bg-white rounded-lg p-4 shadow-md"
          style={{ boxShadow: `0 0 0 4px ${channelColor}20` }}
        >
          <QRCodeSVG
            value={data.qr_data}
            size={224}
            level="H"
            includeMargin={false}
            imageSettings={{
              src: "",
              height: 0,
              width: 0,
              excavate: false,
            }}
          />
        </div>
        {timeLeft !== null && timeLeft > 0 && (
          <Badge
            variant={timeLeft < 30 ? "destructive" : "secondary"}
            className="absolute -top-2 -right-2 flex items-center gap-1"
          >
            <Timer className="size-3" />
            {formatTime(timeLeft)}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Smartphone className="size-4" />
        Open {channelName} on your phone and scan
      </div>

      {timeLeft !== null && timeLeft < 30 && (
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 size-4" />
          Refresh QR Code
        </Button>
      )}
    </div>
  )
}

export function ConnectChannelDialog({
  channel,
  open,
  onOpenChange,
  onConnect,
}: ConnectChannelDialogProps) {
  const [isConnecting, setIsConnecting] = useState(false)

  if (!channel) return null

  const Icon = channel.icon
  const showQRCode = isQRAuthType(channel.auth)

  async function handleConnect() {
    if (!onConnect || !channel) return

    setIsConnecting(true)
    try {
      await onConnect(channel)
      onOpenChange(false)
    } finally {
      setIsConnecting(false)
    }
  }

  function getAuthDescription(authType: string): string {
    switch (authType) {
      case "qr_code":
        return "Scan the QR code with your mobile app to connect."
      case "bot_token":
        return "Enter your bot token to connect the channel."
      case "oauth":
        return "You will be redirected to authorize access."
      case "access_token":
        return "Enter your access token to connect."
      case "link_device":
        return "Link your device by scanning the QR code."
      case "local":
        return "Connect using local configuration."
      default:
        return "Click connect to proceed."
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={showQRCode ? "sm:max-w-[500px]" : "sm:max-w-[425px]"}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="size-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${channel.color}15` }}
            >
              <Icon className="size-5" style={{ color: channel.color }} />
            </div>
            <div>
              <DialogTitle>Connect {channel.name}</DialogTitle>
              <DialogDescription>{channel.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {showQRCode ? (
          <QRCodeDisplay
            channelId={channel.id}
            channelName={channel.name}
            channelColor={channel.color}
          />
        ) : (
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              {getAuthDescription(channel.auth)}
            </p>

            <div className="mt-4 space-y-4">
              <div className="text-sm">
                <p className="font-medium mb-2">Features:</p>
                <ul className="text-muted-foreground space-y-1">
                  {channel.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isConnecting}
          >
            Cancel
          </Button>
          {!showQRCode && (
            <Button onClick={handleConnect} disabled={isConnecting}>
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
