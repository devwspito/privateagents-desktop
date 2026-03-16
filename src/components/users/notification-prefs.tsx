"use client"

import { useState } from "react"
import {
  Bell,
  BellOff,
  CheckCircle2,
  Clock,
  Mail,
  Megaphone,
  Shield,
} from "lucide-react"

import type { User } from "@/lib/api"

import { cn } from "@/lib/utils"

import { toast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"

interface NotificationPrefs {
  emailNotifications: boolean
  approvalRequests: boolean
  taskUpdates: boolean
  weeklyDigest: boolean
  realTimeAlerts: boolean
}

const defaultPrefs: NotificationPrefs = {
  emailNotifications: true,
  approvalRequests: true,
  taskUpdates: true,
  weeklyDigest: false,
  realTimeAlerts: true,
}

interface NotificationPrefItem {
  key: keyof NotificationPrefs
  label: string
  description: string
  icon: typeof Bell
}

const notificationItems: NotificationPrefItem[] = [
  {
    key: "emailNotifications",
    label: "Email Notifications",
    description: "Receive notifications via email",
    icon: Mail,
  },
  {
    key: "approvalRequests",
    label: "Approval Requests",
    description: "Get notified when approvals need your review",
    icon: Shield,
  },
  {
    key: "taskUpdates",
    label: "Task Updates",
    description: "Updates on task completions and failures",
    icon: CheckCircle2,
  },
  {
    key: "weeklyDigest",
    label: "Weekly Digest",
    description: "Summary of weekly activity and metrics",
    icon: Clock,
  },
  {
    key: "realTimeAlerts",
    label: "Real-time Alerts",
    description: "Instant alerts for critical events",
    icon: Megaphone,
  },
]

interface NotificationPrefsProps {
  user: User
  onUpdate?: (prefs: NotificationPrefs) => void
  disabled?: boolean
}

export function NotificationPrefs({
  user: _user,
  onUpdate,
  disabled = false,
}: NotificationPrefsProps) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(defaultPrefs)
  const [isLoading, setIsLoading] = useState<string | null>(null)

  async function handleToggle(key: keyof NotificationPrefs, checked: boolean) {
    const newPrefs = { ...prefs, [key]: checked }
    setPrefs(newPrefs)
    setIsLoading(key)

    try {
      await new Promise((resolve) => setTimeout(resolve, 300))

      toast({
        title: "Preference updated",
        description: `${notificationItems.find((item) => item.key === key)?.label} ${checked ? "enabled" : "disabled"}`,
      })

      onUpdate?.(newPrefs)
    } catch (error) {
      setPrefs(prefs)
      toast({
        variant: "destructive",
        title: "Failed to update preference",
        description:
          error instanceof Error ? error.message : "An error occurred",
      })
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Bell className="size-4 text-muted-foreground" />
        <h4 className="text-sm font-medium">Notification Preferences</h4>
      </div>

      <div className="space-y-1">
        {notificationItems.map((item, index) => {
          const Icon = item.icon
          const isEnabled = prefs[item.key]
          const isItemLoading = isLoading === item.key

          return (
            <div key={item.key}>
              {index > 0 && <Separator className="my-3" />}
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className={cn(
                      "size-8 rounded-md flex items-center justify-center shrink-0",
                      isEnabled
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <Label
                      htmlFor={item.key}
                      className={cn(
                        "text-sm font-medium cursor-pointer",
                        disabled && "cursor-not-allowed opacity-50"
                      )}
                    >
                      {item.label}
                    </Label>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.description}
                    </p>
                  </div>
                </div>
                <Switch
                  id={item.key}
                  checked={isEnabled}
                  onCheckedChange={(checked) => handleToggle(item.key, checked)}
                  disabled={disabled || isItemLoading}
                  className="shrink-0 ml-4"
                />
              </div>
            </div>
          )
        })}
      </div>

      {disabled && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
          <BellOff className="size-3" />
          <span>Notification preferences can only be edited by the user</span>
        </div>
      )}
    </div>
  )
}
