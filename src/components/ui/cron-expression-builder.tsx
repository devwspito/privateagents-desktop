"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Clock, Edit2, Info } from "lucide-react"

import { cn } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export interface CronPreset {
  value: string
  label: string
  description: string
}

const PRESET_SCHEDULES: CronPreset[] = [
  {
    value: "* * * * *",
    label: "Every minute",
    description: "Runs every minute",
  },
  {
    value: "*/5 * * * *",
    label: "Every 5 minutes",
    description: "Runs every 5 minutes",
  },
  {
    value: "*/15 * * * *",
    label: "Every 15 minutes",
    description: "Runs every 15 minutes",
  },
  {
    value: "*/30 * * * *",
    label: "Every 30 minutes",
    description: "Runs every 30 minutes",
  },
  {
    value: "0 * * * *",
    label: "Hourly",
    description: "Runs at the start of every hour",
  },
  {
    value: "0 */2 * * *",
    label: "Every 2 hours",
    description: "Runs every 2 hours",
  },
  {
    value: "0 */6 * * *",
    label: "Every 6 hours",
    description: "Runs every 6 hours",
  },
  {
    value: "0 */12 * * *",
    label: "Every 12 hours",
    description: "Runs every 12 hours",
  },
  {
    value: "0 0 * * *",
    label: "Daily at midnight",
    description: "Runs every day at 00:00",
  },
  {
    value: "0 9 * * *",
    label: "Daily at 9 AM",
    description: "Runs every day at 09:00",
  },
  {
    value: "0 17 * * *",
    label: "Daily at 5 PM",
    description: "Runs every day at 17:00",
  },
  {
    value: "0 0 * * 1",
    label: "Weekly on Monday",
    description: "Runs every Monday at 00:00",
  },
  {
    value: "0 0 * * 0",
    label: "Weekly on Sunday",
    description: "Runs every Sunday at 00:00",
  },
  {
    value: "0 0 1 * *",
    label: "Monthly (1st)",
    description: "Runs on the 1st of every month",
  },
  {
    value: "0 0 15 * *",
    label: "Monthly (15th)",
    description: "Runs on the 15th of every month",
  },
  {
    value: "0 0 1 1 *",
    label: "Yearly",
    description: "Runs on January 1st at 00:00",
  },
]

type ScheduleMode = "preset" | "custom"

interface CronExpressionBuilderProps {
  value?: string
  onChange?: (value: string) => void
  className?: string
  disabled?: boolean
  presets?: CronPreset[]
  showDescription?: boolean
}

function isValidCronExpression(expression: string): boolean {
  if (!expression.trim()) return false
  const parts = expression.trim().split(/\s+/)
  if (parts.length !== 5) return false

  const patterns = [
    /^(\*|([0-9]|[1-5][0-9])(-([0-9]|[1-5][0-9]))?(,([0-9]|[1-5][0-9])(-([0-9]|[1-5][0-9]))?)*|\/([0-9]|[1-5][0-9])|\*\/([0-9]|[1-5][0-9]))$/,
    /^(\*|([0-9]|1[0-9]|2[0-3])(-([0-9]|1[0-9]|2[0-3]))?(,([0-9]|1[0-9]|2[0-3])(-([0-9]|1[0-9]|2[0-3]))?)*|\/([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3]))$/,
    /^(\*|([1-9]|[12][0-9]|3[01])(-([1-9]|[12][0-9]|3[01]))?(,([1-9]|[12][0-9]|3[01])(-([1-9]|[12][0-9]|3[01]))?)*|\/([1-9]|[12][0-9]|3[01])|\*\/([1-9]|[12][0-9]|3[01]))$/,
    /^(\*|([1-9]|1[0-2])(-([1-9]|1[0-2]))?(,([1-9]|1[0-2])(-([1-9]|1[0-2]))?)*|\/([1-9]|1[0-2])|\*\/([1-9]|1[0-2])|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)$/i,
    /^(\*|[0-6](-[0-6])?(,[0-6](-[0-6])?)*|\/[0-6]|\*\/[0-6]|sun|mon|tue|wed|thu|fri|sat)$/i,
  ]

  return parts.every((part, index) => patterns[index]?.test(part) ?? false)
}

function describeCronExpression(expression: string): string {
  if (!expression.trim()) return "No schedule set"

  const parts = expression.trim().split(/\s+/)
  if (parts.length !== 5) return "Invalid expression"

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts as [string, string, string, string, string]

  const formatTime = (h: string, m: string): string => {
    if (h === "*" && m === "*") return ""
    if (h === "*") return `every hour at minute ${m.replace("*/", "")}`
    if (m === "*") m = "0"
    const hourNum = parseInt(h, 10)
    const minuteNum = parseInt(m, 10)
    const period = hourNum >= 12 ? "PM" : "AM"
    const displayHour = hourNum % 12 || 12
    return `${displayHour}:${minuteNum.toString().padStart(2, "0")} ${period}`
  }

  if (
    minute === "*" &&
    hour === "*" &&
    dayOfMonth === "*" &&
    month === "*" &&
    dayOfWeek === "*"
  ) {
    return "Every minute"
  }

  if (
    minute?.startsWith("*/") &&
    hour === "*" &&
    dayOfMonth === "*" &&
    month === "*" &&
    dayOfWeek === "*"
  ) {
    return `Every ${minute.slice(2)} minutes`
  }

  if (
    minute === "0" &&
    hour?.startsWith("*/") &&
    dayOfMonth === "*" &&
    month === "*" &&
    dayOfWeek === "*"
  ) {
    return `Every ${hour.slice(2)} hours`
  }

  if (
    minute === "0" &&
    hour === "*" &&
    dayOfMonth === "*" &&
    month === "*" &&
    dayOfWeek === "*"
  ) {
    return "Every hour"
  }

  if (dayOfMonth === "*" && month === "*" && dayOfWeek !== "*") {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ]
    const dayNames = (dayOfWeek ?? "")
      .split(",")
      .map((d) => days[parseInt(d, 10)] || d)
    const timeStr = formatTime(hour, minute)
    return dayNames.length === 1
      ? `Every ${dayNames[0]}${timeStr ? ` at ${timeStr}` : ""}`
      : `Every ${dayNames.join(", ")}${timeStr ? ` at ${timeStr}` : ""}`
  }

  if (dayOfMonth !== "*" && month === "*" && dayOfWeek === "*") {
    const timeStr = formatTime(hour, minute)
    if (dayOfMonth === "1") {
      return `Monthly on the 1st${timeStr ? ` at ${timeStr}` : ""}`
    }
    if (dayOfMonth === "15") {
      return `Monthly on the 15th${timeStr ? ` at ${timeStr}` : ""}`
    }
    return `Monthly on day ${dayOfMonth}${timeStr ? ` at ${timeStr}` : ""}`
  }

  if (dayOfMonth === "*" && month !== "*") {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]
    const monthNum = parseInt(month, 10)
    const timeStr = formatTime(hour, minute)
    return `Yearly in ${months[monthNum - 1]}${timeStr ? ` at ${timeStr}` : ""}`
  }

  const timeStr = formatTime(hour, minute)
  return timeStr ? `Daily at ${timeStr}` : expression
}

export function CronExpressionBuilder({
  value = "* * * * *",
  onChange,
  className,
  disabled = false,
  presets = PRESET_SCHEDULES,
  showDescription = true,
}: CronExpressionBuilderProps) {
  const [mode, setMode] = useState<ScheduleMode>(() => {
    return presets.some((p) => p.value === value) ? "preset" : "custom"
  })

  const [selectedPreset, setSelectedPreset] = useState<string>(() => {
    return presets.some((p) => p.value === value)
      ? value
      : (presets[0]?.value ?? "* * * * *")
  })

  const [customExpression, setCustomExpression] = useState<string>(() => {
    return presets.some((p) => p.value === value) ? "" : value
  })

  useEffect(() => {
    if (presets.some((p) => p.value === value)) {
      setMode("preset")
      setSelectedPreset(value)
    } else if (value) {
      setMode("custom")
      setCustomExpression(value)
    }
  }, [value, presets])

  const handleModeChange = useCallback(
    (newMode: ScheduleMode) => {
      if (disabled) return
      setMode(newMode)
      if (newMode === "preset") {
        onChange?.(selectedPreset)
      } else if (customExpression) {
        onChange?.(customExpression)
      }
    },
    [disabled, selectedPreset, customExpression, onChange]
  )

  const handlePresetChange = useCallback(
    (preset: string) => {
      if (disabled) return
      setSelectedPreset(preset)
      onChange?.(preset)
    },
    [disabled, onChange]
  )

  const handleCustomChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return
      const newValue = e.target.value
      setCustomExpression(newValue)
      if (isValidCronExpression(newValue)) {
        onChange?.(newValue)
      }
    },
    [disabled, onChange]
  )

  const currentExpression =
    mode === "preset" ? selectedPreset : customExpression
  const isValid = mode === "preset" || isValidCronExpression(customExpression)
  const description = useMemo(
    () => describeCronExpression(currentExpression),
    [currentExpression]
  )

  const selectedPresetData = presets.find((p) => p.value === selectedPreset)

  return (
    <div className={cn("space-y-3", className)}>
      <ToggleGroup
        type="single"
        value={mode}
        onValueChange={(v) => v && handleModeChange(v as ScheduleMode)}
        className="justify-start"
        disabled={disabled}
      >
        <ToggleGroupItem
          value="preset"
          aria-label="Use preset schedule"
          className="gap-2"
        >
          <Clock className="size-4" />
          Preset
        </ToggleGroupItem>
        <ToggleGroupItem
          value="custom"
          aria-label="Use custom cron expression"
          className="gap-2"
        >
          <Edit2 className="size-4" />
          Custom
        </ToggleGroupItem>
      </ToggleGroup>

      {mode === "preset" ? (
        <div className="space-y-2">
          <Label htmlFor="cron-preset">Schedule</Label>
          <Select
            value={selectedPreset}
            onValueChange={handlePresetChange}
            disabled={disabled}
          >
            <SelectTrigger id="cron-preset">
              <SelectValue placeholder="Select a schedule">
                {selectedPresetData?.label}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {presets.map((preset) => (
                <SelectItem key={preset.value} value={preset.value}>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{preset.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {preset.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="cron-custom">Cron Expression</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 px-2">
                  <Info className="size-3.5 mr-1" />
                  Help
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">
                    Cron Expression Format
                  </h4>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <code className="block bg-muted p-2 rounded font-mono">
                      minute hour day month weekday
                    </code>
                    <ul className="space-y-1 mt-2">
                      <li>
                        <strong>minute:</strong> 0-59
                      </li>
                      <li>
                        <strong>hour:</strong> 0-23
                      </li>
                      <li>
                        <strong>day:</strong> 1-31
                      </li>
                      <li>
                        <strong>month:</strong> 1-12
                      </li>
                      <li>
                        <strong>weekday:</strong> 0-6 (Sun-Sat)
                      </li>
                    </ul>
                    <p className="mt-2">
                      Use <code>*</code> for any value, <code>*/n</code> for
                      every n
                    </p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <Input
            id="cron-custom"
            value={customExpression}
            onChange={handleCustomChange}
            placeholder="* * * * *"
            className={cn(
              "font-mono",
              !isValid && customExpression && "border-destructive"
            )}
            disabled={disabled}
            aria-invalid={!isValid && !!customExpression}
          />
          {!isValid && customExpression && (
            <p className="text-xs text-destructive">Invalid cron expression</p>
          )}
        </div>
      )}

      {showDescription && currentExpression && isValid && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-normal gap-1.5">
            <Clock className="size-3" />
            {description}
          </Badge>
          <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
            {currentExpression}
          </code>
        </div>
      )}
    </div>
  )
}

export { PRESET_SCHEDULES as cronPresets }
