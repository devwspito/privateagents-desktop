"use client"

import { useCallback, useState } from "react"
import {
  Check,
  Copy,
  Loader2,
  MonitorSmartphone,
  RefreshCw,
} from "lucide-react"

import { useRegenerateRemoteTunnel, useRemoteTunnelInfo } from "@/lib/api/hooks"

import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { QRCodeSVG } from "qrcode.react"

export function ProfileContentRemoteAccess() {
  const { data, isLoading } = useRemoteTunnelInfo()
  const regenerate = useRegenerateRemoteTunnel()
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    if (!data?.remote_url) return
    await navigator.clipboard.writeText(data.remote_url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [data?.remote_url])

  const handleRegenerate = useCallback(async () => {
    try {
      await regenerate.mutateAsync()
      toast({
        title: "Token regenerado",
        description: "El link anterior ya no funciona.",
      })
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo regenerar el token.",
      })
    }
  }, [regenerate, toast])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  return (
    <Card asChild>
      <article>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MonitorSmartphone className="h-4 w-4" />
            Remote Access
          </CardTitle>
          <CardDescription>
            Controla tu agente desde el movil escaneando el QR o compartiendo el
            link.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Desktop status */}
          <div className="flex items-center gap-2">
            <div
              className={`h-2.5 w-2.5 rounded-full ${
                (data as typeof data & { desktop_connected?: boolean }).desktop_connected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-sm text-muted-foreground">
              Desktop {(data as typeof data & { desktop_connected?: boolean }).desktop_connected ? "conectado" : "desconectado"}
            </span>
          </div>

          {/* QR Code */}
          <div className="flex justify-center rounded-lg border bg-white p-4">
            <QRCodeSVG value={data.remote_url ?? ""} size={180} />
          </div>

          {/* URL + Copy */}
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 rounded-md border bg-muted px-3 py-2">
              <p className="text-xs text-muted-foreground truncate font-mono">
                {data.remote_url}
              </p>
            </div>
            <Button
              size="icon"
              variant="outline"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Regenerate */}
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={handleRegenerate}
            disabled={regenerate.isPending}
          >
            {regenerate.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Regenerar link
          </Button>
        </CardContent>
      </article>
    </Card>
  )
}
