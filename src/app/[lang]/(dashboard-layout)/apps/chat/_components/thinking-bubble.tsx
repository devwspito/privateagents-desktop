"use client"

import { useState } from "react"
import { Brain, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

export function ThinkingBubble({
  thinking,
  isStreaming,
}: {
  thinking: string
  isStreaming: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)

  if (!thinking) return null

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={cn(
          "rounded-lg border border-border bg-muted/50 overflow-hidden",
          "w-full max-w-sm"
        )}
      >
        <CollapsibleTrigger className="flex items-center gap-2 w-full px-3 py-2 text-sm">
          <Brain
            className={cn(
              "h-4 w-4 text-muted-foreground",
              isStreaming && "animate-pulse"
            )}
          />
          <span className="font-medium text-foreground">
            {isStreaming ? "Thinking..." : "Reasoning"}
          </span>
          <ChevronDown
            className={cn(
              "ml-auto h-3.5 w-3.5 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-2.5">
            <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {thinking}
            </p>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
