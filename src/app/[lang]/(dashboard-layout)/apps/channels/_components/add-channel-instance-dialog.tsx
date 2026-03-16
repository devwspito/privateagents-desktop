"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ExternalLink,
  Globe,
  Loader2,
  QrCode,
  RefreshCw,
  Smartphone,
  Timer,
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

import type { AddChannelInstanceFormType } from "@/schemas/add-channel-instance-schema"
import type { ChannelAuthType, ChannelDefinition } from "../types"

import { AddChannelInstanceSchema } from "@/schemas/add-channel-instance-schema"

import { useChannelQR } from "@/lib/api/hooks"
import { cn } from "@/lib/utils"

import { toast } from "@/hooks/use-toast"
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { QRCodeSVG } from "qrcode.react"

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

const WIZARD_STEPS = [
  { id: 1, name: "Select Channel", description: "Choose a platform" },
  { id: 2, name: "Authentication", description: "Configure credentials" },
  { id: 3, name: "Routing", description: "Set up message routing" },
  { id: 4, name: "Review", description: "Confirm settings" },
] as const

function isQRAuthType(auth: ChannelAuthType): boolean {
  return auth === "qr_code" || auth === "link_device"
}

interface QRCodeDisplayProps {
  channelId: string
  channelName: string
  channelColor: string
}

function QRCodeDisplay({
  channelId,
  channelName,
  channelColor,
}: QRCodeDisplayProps) {
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
        <div className="size-48 bg-muted rounded-lg flex items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Generating QR code...</p>
      </div>
    )
  }

  if (error || !data?.qr_data) {
    return (
      <div className="flex flex-col items-center py-6 space-y-4">
        <div className="size-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
          <div className="text-center text-muted-foreground">
            <QrCode className="size-12 mx-auto mb-2 opacity-50" />
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
    <div className="flex flex-col items-center py-4 space-y-4">
      <div className="relative">
        <div
          className="size-48 bg-white rounded-lg p-3 shadow-md"
          style={{ boxShadow: `0 0 0 4px ${channelColor}20` }}
        >
          <QRCodeSVG
            value={data.qr_data}
            size={168}
            level="H"
            includeMargin={false}
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

interface Agent {
  id: string
  name?: string
}

interface AddChannelInstanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: AddChannelInstanceFormType) => Promise<void>
  agents: Agent[]
  isLoading?: boolean
}

export function AddChannelInstanceDialog({
  open,
  onOpenChange,
  onSubmit,
  agents,
  isLoading = false,
}: AddChannelInstanceDialogProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedChannel, setSelectedChannel] =
    useState<ChannelDefinition | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<AddChannelInstanceFormType>({
    resolver: zodResolver(AddChannelInstanceSchema),
    defaultValues: {
      platform: "",
      name: "",
      bot_token: "",
      access_token: "",
      homeserver_url: "",
      default_agent_id: "",
      auto_respond_offline: true,
    },
    mode: "onChange",
  })

  const platformValue = form.watch("platform")

  useEffect(() => {
    if (platformValue) {
      const channel = CHANNELS.find((c) => c.id === platformValue)
      setSelectedChannel(channel || null)
    } else {
      setSelectedChannel(null)
    }
  }, [platformValue])

  useEffect(() => {
    if (open) {
      setCurrentStep(1)
      form.reset()
      setSelectedChannel(null)
    }
  }, [open, form])

  const handleNext = useCallback(() => {
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1)
    }
  }, [currentStep])

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }, [currentStep])

  const handleChannelSelect = useCallback(
    (channel: ChannelDefinition) => {
      form.setValue("platform", channel.id)
      form.clearErrors("platform")
      handleNext()
    },
    [form, handleNext]
  )

  const handleSubmit = useCallback(async () => {
    if (!selectedChannel) return

    setIsSubmitting(true)
    try {
      await onSubmit(form.getValues())
      toast({
        title: "Channel added",
        description: `${selectedChannel.name} has been connected successfully.`,
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to add channel",
        description:
          error instanceof Error ? error.message : "An error occurred",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [form, onOpenChange, onSubmit, selectedChannel])

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 1:
        return !!selectedChannel
      case 2:
        if (!selectedChannel) return false
        if (isQRAuthType(selectedChannel.auth)) return true
        if (selectedChannel.auth === "bot_token")
          return !!form.getValues("bot_token")
        if (selectedChannel.auth === "access_token")
          return !!form.getValues("access_token")
        if (selectedChannel.auth === "oauth" || selectedChannel.auth === "none")
          return true
        return false
      case 3:
        return !!form.getValues("default_agent_id")
      case 4:
        return true
      default:
        return false
    }
  }, [currentStep, selectedChannel, form])

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <ChannelSelectionStep onSelect={handleChannelSelect} />
      case 2:
        return (
          <AuthenticationStep
            channel={selectedChannel}
            form={form}
            onContinue={handleNext}
          />
        )
      case 3:
        return <RoutingStep form={form} agents={agents} />
      case 4:
        return (
          <ReviewStep
            channel={selectedChannel}
            formValues={form.getValues()}
            agents={agents}
          />
        )
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Channel Instance</DialogTitle>
          <DialogDescription>
            Connect a new messaging platform for your agents
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <StepIndicator currentStep={currentStep} />
        </div>

        <ScrollArea className="max-h-[400px] pr-4">
          <Form {...form}>{renderStepContent()}</Form>
        </ScrollArea>

        <DialogFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting || isLoading}
          >
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Button>

          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={!canProceed || isSubmitting || isLoading}
            >
              Continue
              <ArrowRight className="ml-2 size-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!canProceed || isSubmitting || isLoading}
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Check className="mr-2 size-4" />
                  Add Channel
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface StepIndicatorProps {
  currentStep: number
}

function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between">
      {WIZARD_STEPS.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "size-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                currentStep > step.id
                  ? "bg-primary text-primary-foreground"
                  : currentStep === step.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {currentStep > step.id ? <Check className="size-4" /> : step.id}
            </div>
            <span className="text-xs text-muted-foreground mt-1 hidden sm:block">
              {step.name}
            </span>
          </div>
          {index < WIZARD_STEPS.length - 1 && (
            <div
              className={cn(
                "h-0.5 w-12 mx-2",
                currentStep > step.id ? "bg-primary" : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}

interface ChannelSelectionStepProps {
  onSelect: (channel: ChannelDefinition) => void
}

function ChannelSelectionStep({ onSelect }: ChannelSelectionStepProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Select a messaging platform to connect
      </p>
      <div className="grid grid-cols-2 gap-3">
        {CHANNELS.map((channel) => {
          const Icon = channel.icon
          return (
            <button
              key={channel.id}
              type="button"
              onClick={() => onSelect(channel)}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
                "hover:border-primary hover:bg-accent",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              )}
            >
              <div
                className="size-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${channel.color}15` }}
              >
                <Icon className="size-5" style={{ color: channel.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">{channel.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {channel.description}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface AuthenticationStepProps {
  channel: ChannelDefinition | null
  form: ReturnType<typeof useForm<AddChannelInstanceFormType>>
  onContinue: () => void
}

function AuthenticationStep({
  channel,
  form,
  onContinue,
}: AuthenticationStepProps) {
  if (!channel) return null

  const Icon = channel.icon

  if (isQRAuthType(channel.auth)) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <div
            className="size-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${channel.color}15` }}
          >
            <Icon className="size-5" style={{ color: channel.color }} />
          </div>
          <div>
            <p className="font-medium">{channel.name}</p>
            <p className="text-xs text-muted-foreground">
              {channel.description}
            </p>
          </div>
        </div>

        <QRCodeDisplay
          channelId={channel.id}
          channelName={channel.name}
          channelColor={channel.color}
        />

        <div className="flex items-center justify-center">
          <Button onClick={onContinue}>
            <Check className="mr-2 size-4" />
            Scanned Successfully
          </Button>
        </div>
      </div>
    )
  }

  if (channel.auth === "bot_token") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <div
            className="size-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${channel.color}15` }}
          >
            <Icon className="size-5" style={{ color: channel.color }} />
          </div>
          <div>
            <p className="font-medium">{channel.name}</p>
            <p className="text-xs text-muted-foreground">
              {channel.description}
            </p>
          </div>
        </div>

        <FormField
          control={form.control}
          name="bot_token"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bot Token</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter your bot token..."
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Get your bot token from @BotFather (Telegram) or Discord
                Developer Portal
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

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
    )
  }

  if (channel.auth === "access_token") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <div
            className="size-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${channel.color}15` }}
          >
            <Icon className="size-5" style={{ color: channel.color }} />
          </div>
          <div>
            <p className="font-medium">{channel.name}</p>
            <p className="text-xs text-muted-foreground">
              {channel.description}
            </p>
          </div>
        </div>

        <FormField
          control={form.control}
          name="access_token"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Access Token</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter access token..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="homeserver_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Homeserver URL</FormLabel>
              <FormControl>
                <Input placeholder="https://matrix.org" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    )
  }

  if (channel.auth === "oauth") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <div
            className="size-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${channel.color}15` }}
          >
            <Icon className="size-5" style={{ color: channel.color }} />
          </div>
          <div>
            <p className="font-medium">{channel.name}</p>
            <p className="text-xs text-muted-foreground">
              {channel.description}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Click the button below to authorize with {channel.name}
          </p>
          <Button className="w-full">
            <ExternalLink className="mr-2 size-4" />
            Connect with {channel.name}
          </Button>
        </div>

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
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
        <div
          className="size-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${channel.color}15` }}
        >
          <Icon className="size-5" style={{ color: channel.color }} />
        </div>
        <div>
          <p className="font-medium">{channel.name}</p>
          <p className="text-xs text-muted-foreground">{channel.description}</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        No additional authentication required. Click Continue to proceed.
      </p>

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
  )
}

interface RoutingStepProps {
  form: ReturnType<typeof useForm<AddChannelInstanceFormType>>
  agents: Agent[]
}

function RoutingStep({ form, agents }: RoutingStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Configure how incoming messages are routed to your agents.
        </p>
      </div>

      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Display Name (Optional)</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Sales WhatsApp" {...field} />
            </FormControl>
            <FormDescription>
              A friendly name to identify this channel instance
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="default_agent_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Route Messages to</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select an agent" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name || agent.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              All incoming messages will be routed to this agent
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="auto_respond_offline"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">
                Auto-respond when offline
              </FormLabel>
              <FormDescription>
                Send an acknowledgment message when no agent is available
              </FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  )
}

interface ReviewStepProps {
  channel: ChannelDefinition | null
  formValues: AddChannelInstanceFormType
  agents: Agent[]
}

function ReviewStep({ channel, formValues, agents }: ReviewStepProps) {
  if (!channel) return null

  const Icon = channel.icon
  const selectedAgent = agents.find((a) => a.id === formValues.default_agent_id)

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Review your channel configuration before connecting.
      </p>

      <div className="space-y-4">
        <div className="p-4 bg-muted rounded-lg space-y-4">
          <div className="flex items-center gap-3">
            <div
              className="size-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${channel.color}15` }}
            >
              <Icon className="size-6" style={{ color: channel.color }} />
            </div>
            <div>
              <p className="font-medium text-lg">{channel.name}</p>
              <p className="text-sm text-muted-foreground">
                {formValues.name || "No display name"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Platform</p>
              <p className="font-medium">{channel.description}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Authentication</p>
              <p className="font-medium capitalize">
                {channel.auth.replace("_", " ")}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Default Agent</p>
              <p className="font-medium">
                {selectedAgent?.name || selectedAgent?.id || "Not selected"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Auto-respond Offline</p>
              <p className="font-medium">
                {formValues.auto_respond_offline ? "Enabled" : "Disabled"}
              </p>
            </div>
          </div>

          <div>
            <p className="text-muted-foreground text-sm mb-2">Features</p>
            <div className="flex flex-wrap gap-1">
              {channel.features.map((feature) => (
                <Badge key={feature} variant="secondary" className="capitalize">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-sm">
            <span className="font-medium">Ready to connect:</span> Click
            &ldquo;Add Channel&rdquo; to establish the connection with{" "}
            {channel.name}.
          </p>
        </div>
      </div>
    </div>
  )
}
