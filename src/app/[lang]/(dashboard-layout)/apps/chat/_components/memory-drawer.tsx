"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import { MemoryEntriesViewer } from "../../agents/_components/MemoryEntriesViewer"

interface MemoryDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agentId: string
  agentName?: string
}

export function MemoryDrawer({
  open,
  onOpenChange,
  agentId,
  agentName,
}: MemoryDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[500px] sm:max-w-[500px] p-0">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle>
            Memoria: {agentName || agentId}
          </SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-6 overflow-auto h-[calc(100%-60px)]">
          <MemoryEntriesViewer agentId={agentId} compact />
        </div>
      </SheetContent>
    </Sheet>
  )
}
