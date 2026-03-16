"use client"

import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"

interface ChatSidebarSearchInputProps {
  value: string
  onChange: (value: string) => void
}

export function ChatSidebarSearchInput({
  value,
  onChange,
}: ChatSidebarSearchInputProps) {
  return (
    <div className="relative grow">
      <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="w-full bg-muted ps-9"
        placeholder="Buscar por @agente o texto..."
        type="search"
        aria-label="Buscar chats o hilos"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
