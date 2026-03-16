"use client"

import { CardHeader } from "@/components/ui/card"
import { ChatSidebarActionButtons } from "./chat-sidebar-action-buttons"
import { ChatSidebarSearchInput } from "./chat-sidebar-search-input"

interface ChatSidebarHeaderProps {
  searchQuery: string
  onSearchChange: (value: string) => void
}

export function ChatSidebarHeader({
  searchQuery,
  onSearchChange,
}: ChatSidebarHeaderProps) {
  return (
    <CardHeader className="flex flex-row items-center space-y-0 gap-x-1.5 p-3 border-b border-border">
      <div className="grow flex justify-between items-center gap-2">
        <ChatSidebarSearchInput value={searchQuery} onChange={onSearchChange} />
        <ChatSidebarActionButtons />
      </div>
    </CardHeader>
  )
}
