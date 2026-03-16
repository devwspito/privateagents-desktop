"use client"

import { useState } from "react"
import {
  Check,
  ExternalLink,
  Globe,
  Loader2,
  MessageSquare,
} from "lucide-react"
import { FaApple, FaMicrosoft } from "react-icons/fa"
import {
  SiDiscord,
  SiGooglechat,
  SiMatrix,
  SiSignal,
  SiSlack,
  SiTelegram,
  SiWhatsapp,
} from "react-icons/si"

import type { ChannelDefinition } from "./types"

import { useConnectChannel } from "@/lib/api/hooks"

import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  ChannelInstancesTable,
  ConnectChannelDialog,
  RoutingRulesTable,
} from "./_components"

const SiMicrosoftteams = FaMicrosoft

const CHANNELS: ChannelDefinition[] = [
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: SiWhatsapp,
    color: "#25D366",
    description: "WhatsApp Business via Baileys",
    auth: "qr_code",
    features: ["messages", "media", "groups"],
  },
  {
    id: "telegram",
    name: "Telegram",
    icon: SiTelegram,
    color: "#0088cc",
    description: "Telegram Bot via grammY",
    auth: "bot_token",
    features: ["messages", "media", "groups", "inline"],
  },
  {
    id: "slack",
    name: "Slack",
    icon: SiSlack,
    color: "#4A154B",
    description: "Slack workspace via Bolt",
    auth: "oauth",
    features: ["messages", "threads", "reactions", "files"],
  },
  {
    id: "discord",
    name: "Discord",
    icon: SiDiscord,
    color: "#5865F2",
    description: "Discord server via discord.js",
    auth: "bot_token",
    features: ["messages", "threads", "reactions", "voice"],
  },
  {
    id: "google_chat",
    name: "Google Chat",
    icon: SiGooglechat,
    color: "#00AC47",
    description: "Google Workspace Chat",
    auth: "oauth",
    features: ["messages", "spaces", "cards"],
  },
  {
    id: "signal",
    name: "Signal",
    icon: SiSignal,
    color: "#3A76F0",
    description: "Signal Messenger",
    auth: "link_device",
    features: ["messages", "media", "groups"],
  },
  {
    id: "imessage",
    name: "iMessage",
    icon: FaApple,
    color: "#007AFF",
    description: "iMessage via BlueBubbles (macOS)",
    auth: "local",
    features: ["messages", "media", "tapback"],
  },
  {
    id: "teams",
    name: "Microsoft Teams",
    icon: SiMicrosoftteams,
    color: "#6264A7",
    description: "Microsoft Teams",
    auth: "oauth",
    features: ["messages", "channels", "cards"],
  },
  {
    id: "matrix",
    name: "Matrix",
    icon: SiMatrix,
    color: "#000000",
    description: "Matrix/Element",
    auth: "access_token",
    features: ["messages", "rooms", "e2ee"],
  },
  {
    id: "webchat",
    name: "WebChat",
    icon: Globe,
    color: "#6366F1",
    description: "Embedded web widget",
    auth: "none",
    features: ["messages", "typing", "read_receipts"],
  },
]

export default function ChannelsPage() {
  const [connectingChannel, setConnectingChannel] =
    useState<ChannelDefinition | null>(null)

  const connectChannel = useConnectChannel()

  async function handleConnect(channel: ChannelDefinition) {
    try {
      const result = (await connectChannel.mutateAsync({
        channel: channel.id,
        config: {},
      })) as { auth_url?: string } | undefined
      if (result?.auth_url) {
        window.open(result.auth_url, "_blank")
      }
      toast({
        title: "Channel connected",
        description: `${channel.name} has been connected successfully.`,
      })
      setConnectingChannel(null)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to connect",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while connecting the channel.",
      })
    }
  }

  return (
    <div className="container p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="size-6" />
            Channels
          </h1>
          <p className="text-muted-foreground">
            Connect messaging platforms for your agents (powered by OpenClaw)
          </p>
        </div>
      </div>

      <ChannelInstancesTable
        onAddChannel={() => setConnectingChannel(CHANNELS[0] ?? null)}
      />

      <RoutingRulesTable />

      <ConnectChannelDialog
        channel={connectingChannel}
        open={!!connectingChannel}
        onOpenChange={(open: boolean) => !open && setConnectingChannel(null)}
        onConnect={handleConnect}
      />

      <Dialog
        open={
          !!connectingChannel &&
          !["qr_code", "link_device"].includes(connectingChannel?.auth || "")
        }
        onOpenChange={(open: boolean) => !open && setConnectingChannel(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {connectingChannel && (
                <>
                  <connectingChannel.icon
                    className="size-5"
                    style={{ color: connectingChannel.color }}
                  />
                  Connect {connectingChannel.name}
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {connectingChannel?.auth === "bot_token" && (
              <div className="space-y-2">
                <Label>Bot Token</Label>
                <Input type="password" placeholder="Enter your bot token..." />
                <p className="text-xs text-muted-foreground">
                  Get your bot token from @BotFather (Telegram) or Discord
                  Developer Portal
                </p>
              </div>
            )}

            {connectingChannel?.auth === "oauth" && (
              <div className="space-y-3">
                <p className="text-sm">
                  Click the button below to authorize with{" "}
                  {connectingChannel.name}
                </p>
                <Button className="w-full">
                  <ExternalLink className="mr-2 size-4" />
                  Connect with {connectingChannel.name}
                </Button>
              </div>
            )}

            {connectingChannel?.auth === "access_token" && (
              <div className="space-y-2">
                <Label>Access Token</Label>
                <Input type="password" placeholder="Enter access token..." />
                <Label>Homeserver URL</Label>
                <Input placeholder="https://matrix.org" />
              </div>
            )}

            <div className="space-y-2 pt-4 border-t">
              <Label>Route messages to</Label>
              <Select defaultValue="auto">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-route by department</SelectItem>
                  <SelectItem value="sales">Sales Agent</SelectItem>
                  <SelectItem value="support">Support Agent</SelectItem>
                  <SelectItem value="all">All Agents (round-robin)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-respond when offline</Label>
                <p className="text-xs text-muted-foreground">
                  Send acknowledgment when no agent is available
                </p>
              </div>
              <Switch />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConnectingChannel(null)}
              disabled={connectChannel.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (connectingChannel) {
                  handleConnect(connectingChannel)
                }
              }}
              disabled={connectChannel.isPending}
            >
              {connectChannel.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Check className="mr-2 size-4" />
                  Connect
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
