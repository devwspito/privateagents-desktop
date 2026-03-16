"use client"

import { Power, PowerOff, Settings } from "lucide-react"

import type { ChannelDefinition, ChannelStatusInfo } from "../types"

import { cn } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface ChannelCardProps {
  channel: ChannelDefinition
  status?: ChannelStatusInfo
  onConnect?: (channel: ChannelDefinition) => void
  onConfigure?: (channel: ChannelDefinition) => void
  onDisconnect?: (channel: ChannelDefinition) => void
}

export function ChannelCard({
  channel,
  status,
  onConnect,
  onConfigure,
  onDisconnect,
}: ChannelCardProps) {
  const Icon = channel.icon
  const connected = status?.connected ?? false

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md",
        connected && "border-green-200 dark:border-green-800"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="size-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${channel.color}15` }}
            >
              <Icon className="size-5" style={{ color: channel.color }} />
            </div>
            <div>
              <CardTitle className="text-base">{channel.name}</CardTitle>
              <CardDescription className="text-xs">
                {channel.description}
              </CardDescription>
            </div>
          </div>
          <ConnectionStatusBadge connected={connected} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1">
          {channel.features.map((feature) => (
            <Badge key={feature} variant="outline" className="text-[10px] h-5">
              {feature}
            </Badge>
          ))}
        </div>

        {connected && status && <ChannelStatusDetails status={status} />}

        <div className="flex gap-2 pt-2">
          {connected ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onConfigure?.(channel)}
              >
                <Settings className="mr-1 size-3" />
                Configure
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => onDisconnect?.(channel)}
              >
                <PowerOff className="size-4" />
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onConnect?.(channel)}
            >
              <Power className="mr-1 size-3" />
              Connect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ConnectionStatusBadge({ connected }: { connected: boolean }) {
  return (
    <Badge
      variant={connected ? "default" : "secondary"}
      className={
        connected
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
      }
    >
      {connected ? "Connected" : "Disconnected"}
    </Badge>
  )
}

function ChannelStatusDetails({ status }: { status: ChannelStatusInfo }) {
  return (
    <div className="text-xs text-muted-foreground space-y-1">
      {status.username && <p>Account: {status.username}</p>}
      {status.workspace && <p>Workspace: {status.workspace}</p>}
      {status.last_seen && (
        <p>Last activity: {new Date(status.last_seen).toLocaleString()}</p>
      )}
    </div>
  )
}
