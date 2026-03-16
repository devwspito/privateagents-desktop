"use client"

import { Shield, ShieldAlert, ShieldCheck } from "lucide-react"

import type { AutonomyLevel } from "@/lib/api/client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type { AutonomyLevel }

export const AUTONOMY_LEVELS: AutonomyLevel[] = ["full", "supervised", "manual"]

export const autonomyLevelLabels: Record<AutonomyLevel, string> = {
  full: "Full Autonomy",
  supervised: "Supervised",
  manual: "Manual",
}

export const autonomyLevelDescriptions: Record<AutonomyLevel, string> = {
  full: "Can act independently without approval",
  supervised: "Most actions require approval",
  manual: "All actions require approval",
}

export const autonomyLevelIcons: Record<AutonomyLevel, React.ReactNode> = {
  full: <ShieldCheck className="size-4 text-green-500" />,
  supervised: <Shield className="size-4 text-yellow-500" />,
  manual: <ShieldAlert className="size-4 text-red-500" />,
}

interface AutonomyLevelDropdownProps {
  value: AutonomyLevel | undefined
  onChange: (value: AutonomyLevel) => void
  disabled?: boolean
  placeholder?: string
}

export function AutonomyLevelDropdown({
  value,
  onChange,
  disabled = false,
  placeholder = "Select autonomy level",
}: AutonomyLevelDropdownProps) {
  return (
    <Select
      value={value || ""}
      onValueChange={(v) => onChange(v as AutonomyLevel)}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder}>
          {value && (
            <div className="flex items-center gap-2">
              {autonomyLevelIcons[value]}
              <span>{autonomyLevelLabels[value]}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {AUTONOMY_LEVELS.map((level) => (
          <SelectItem key={level} value={level}>
            <div className="flex items-start gap-2">
              <div className="mt-0.5">{autonomyLevelIcons[level]}</div>
              <div>
                <div className="font-medium">{autonomyLevelLabels[level]}</div>
                <div className="text-xs text-muted-foreground">
                  {autonomyLevelDescriptions[level]}
                </div>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
