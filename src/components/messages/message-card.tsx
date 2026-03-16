"use client"

import { useState } from "react"
import { ChevronDown, Clock, Globe, Hash, Tag, User } from "lucide-react"

import type { ComponentProps, ReactNode } from "react"

import {
  cn,
  formatDateWithTime,
  formatDistance,
  getInitials,
} from "@/lib/utils"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

export interface MessageMetadata {
  id: string
  sender?: {
    id: string
    name: string
    avatar?: string
  }
  timestamp: string | Date
  tags?: string[]
  priority?: "low" | "medium" | "high"
  channel?: string
  language?: string
  additionalData?: Record<string, unknown>
}

export interface MessageCardProps extends Omit<ComponentProps<typeof Card>, "content"> {
  content: ReactNode
  metadata: MessageMetadata
  showAvatar?: boolean
  defaultExpanded?: boolean
  onMetadataToggle?: (expanded: boolean) => void
}

const priorityVariants: Record<
  string,
  "default" | "secondary" | "destructive"
> = {
  low: "secondary",
  medium: "default",
  high: "destructive",
}

export function MessageCard({
  content,
  metadata,
  showAvatar = true,
  defaultExpanded = false,
  onMetadataToggle,
  className,
  ...props
}: MessageCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const handleToggle = () => {
    const newState = !isExpanded
    setIsExpanded(newState)
    onMetadataToggle?.(newState)
  }

  const formattedTimestamp =
    typeof metadata.timestamp === "string"
      ? metadata.timestamp
      : formatDateWithTime(metadata.timestamp)

  const relativeTime =
    typeof metadata.timestamp === "string"
      ? metadata.timestamp
      : formatDistance(metadata.timestamp)

  return (
    <Card
      data-slot="message-card"
      className={cn("overflow-hidden", className)}
      {...props}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start gap-3">
          {showAvatar && metadata.sender && (
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage
                src={metadata.sender.avatar}
                alt={metadata.sender.name}
              />
              <AvatarFallback>
                {getInitials(metadata.sender.name)}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {metadata.sender && (
                  <span className="font-medium text-sm truncate">
                    {metadata.sender.name}
                  </span>
                )}
                {metadata.priority && (
                  <Badge
                    variant={priorityVariants[metadata.priority]}
                    className="text-xs shrink-0"
                  >
                    {metadata.priority}
                  </Badge>
                )}
              </div>
              <span
                className="text-xs text-muted-foreground shrink-0"
                title={formattedTimestamp}
              >
                {relativeTime}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2">
        <div className="text-sm leading-relaxed">{content}</div>

        <Collapsible
          open={isExpanded}
          onOpenChange={setIsExpanded}
          className="mt-3"
        >
          <CollapsibleTrigger
            onClick={handleToggle}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer w-full"
            aria-label={isExpanded ? "Collapse metadata" : "Expand metadata"}
          >
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform duration-200",
                isExpanded && "rotate-180"
              )}
            />
            <span>Metadata</span>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-2">
            <div className="grid grid-cols-2 gap-2 p-3 bg-muted/50 rounded-md text-xs">
              <MetadataItem
                icon={<Hash className="h-3 w-3" />}
                label="ID"
                value={metadata.id}
              />

              {metadata.channel && (
                <MetadataItem
                  icon={<Globe className="h-3 w-3" />}
                  label="Channel"
                  value={metadata.channel}
                />
              )}

              {metadata.language && (
                <MetadataItem
                  icon={<Globe className="h-3 w-3" />}
                  label="Language"
                  value={metadata.language}
                />
              )}

              <MetadataItem
                icon={<Clock className="h-3 w-3" />}
                label="Timestamp"
                value={formattedTimestamp}
              />

              {metadata.sender && (
                <MetadataItem
                  icon={<User className="h-3 w-3" />}
                  label="Sender"
                  value={metadata.sender.name}
                />
              )}

              {metadata.tags && metadata.tags.length > 0 && (
                <div className="col-span-2 flex items-start gap-2">
                  <Tag className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="flex flex-wrap gap-1">
                    {metadata.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-xs px-1.5 py-0"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {metadata.additionalData &&
                Object.keys(metadata.additionalData).length > 0 && (
                  <div className="col-span-2 border-t pt-2 mt-1">
                    {Object.entries(metadata.additionalData).map(
                      ([key, value]) => (
                        <div key={key} className="flex justify-between py-0.5">
                          <span className="text-muted-foreground capitalize">
                            {key}:
                          </span>
                          <span className="font-mono">
                            {typeof value === "object"
                              ? JSON.stringify(value)
                              : String(value)}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}

interface MetadataItemProps {
  icon: ReactNode
  label: string
  value: string
}

function MetadataItem({ icon, label, value }: MetadataItemProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span className="truncate">
        <span className="text-muted-foreground">{label}:</span>{" "}
        <span className="font-mono">{value}</span>
      </span>
    </div>
  )
}
