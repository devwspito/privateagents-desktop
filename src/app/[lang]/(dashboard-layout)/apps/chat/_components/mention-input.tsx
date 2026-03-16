"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AtSign, Crown } from "lucide-react"

import type { ChatAgent } from "@/lib/api/client"
import type { KeyboardEvent } from "react"

import { cn } from "@/lib/utils"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface MentionInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  placeholder?: string
  disabled?: boolean
  agents: ChatAgent[]
  className?: string
}

interface MentionQuery {
  query: string
  startIndex: number // index of the '@' character in the input value
}

export function MentionInput({
  value,
  onChange,
  // onSubmit not used — send only via button
  placeholder,
  disabled,
  agents,
  className,
}: MentionInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [mentionQuery, setMentionQuery] = useState<MentionQuery | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Filter agents based on the current mention query
  const filteredAgents =
    mentionQuery && agents
      ? agents.filter((agent) => {
          const q = mentionQuery.query.toLowerCase()
          if (!q) return true
          const name = (agent.display_name || agent.name).toLowerCase()
          return name.includes(q) || agent.name.toLowerCase().includes(q)
        })
      : []

  const isDropdownOpen = mentionQuery !== null && filteredAgents.length > 0

  // Detect @mention pattern from cursor position
  const detectMention = useCallback((inputValue: string, cursorPos: number) => {
    // Walk backwards from cursor to find the last unmatched '@'
    const before = inputValue.slice(0, cursorPos)
    const atIndex = before.lastIndexOf("@")

    if (atIndex === -1) {
      setMentionQuery(null)
      return
    }

    // '@' must be at start or preceded by a space/newline
    if (atIndex > 0 && before[atIndex - 1] !== " " && before[atIndex - 1] !== "\n") {
      setMentionQuery(null)
      return
    }

    // Extract the query after '@' (only word characters, dots, hyphens)
    const afterAt = before.slice(atIndex + 1)
    if (/^[\w.-]*$/.test(afterAt)) {
      setMentionQuery({ query: afterAt, startIndex: atIndex })
      setSelectedIndex(0)
    } else {
      setMentionQuery(null)
    }
  }, [])

  // Handle input changes
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value
      onChange(newValue)
      detectMention(newValue, e.target.selectionStart ?? newValue.length)
    },
    [onChange, detectMention]
  )

  // Handle cursor movement (clicking in different positions)
  const handleSelect = useCallback(() => {
    if (inputRef.current) {
      detectMention(value, inputRef.current.selectionStart ?? value.length)
    }
  }, [value, detectMention])

  // Insert the selected agent mention
  const insertMention = useCallback(
    (agent: ChatAgent) => {
      if (!mentionQuery) return

      const mentionText = `@${agent.name} `
      const before = value.slice(0, mentionQuery.startIndex)
      const cursorAfterAt =
        mentionQuery.startIndex + 1 + mentionQuery.query.length
      const after = value.slice(cursorAfterAt)
      const newValue = before + mentionText + after

      onChange(newValue)
      setMentionQuery(null)

      // Restore focus and cursor position
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus()
          const newCursorPos = before.length + mentionText.length
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos)
        }
      })
    },
    [mentionQuery, value, onChange]
  )

  // Keyboard navigation for the dropdown
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (isDropdownOpen) {
        if (e.key === "ArrowDown") {
          e.preventDefault()
          setSelectedIndex((prev) =>
            prev < filteredAgents.length - 1 ? prev + 1 : 0
          )
          return
        }
        if (e.key === "ArrowUp") {
          e.preventDefault()
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredAgents.length - 1
          )
          return
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault()
          const selectedAgent = filteredAgents[selectedIndex]
          if (selectedAgent) {
            insertMention(selectedAgent)
          }
          return
        }
        if (e.key === "Escape") {
          e.preventDefault()
          setMentionQuery(null)
          return
        }
      }

      // Enter and Shift+Enter = new line (default textarea behavior)
      // Send only via the submit button
    },
    [isDropdownOpen, filteredAgents, selectedIndex, insertMention]
  )

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [])

  useEffect(() => {
    autoResize()
  }, [value, autoResize])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setMentionQuery(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Scroll selected item into view
  useEffect(() => {
    if (isDropdownOpen && dropdownRef.current) {
      const selected = dropdownRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      )
      selected?.scrollIntoView({ block: "nearest" })
    }
  }, [selectedIndex, isDropdownOpen])

  return (
    <div className="relative grow">
      <textarea
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onSelect={handleSelect}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        rows={1}
        className={cn(
          "flex min-h-9 max-h-[200px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm transition-colors resize-none placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      />

      {/* Mention autocomplete dropdown */}
      {isDropdownOpen && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full left-0 mb-1 w-72 max-w-[calc(100vw-2rem)] max-h-48 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md z-50"
        >
          {filteredAgents.map((agent, index) => (
            <button
              key={agent.id}
              type="button"
              data-index={index}
              className={cn(
                "flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-accent transition-colors",
                index === selectedIndex && "bg-accent"
              )}
              onMouseDown={(e) => {
                e.preventDefault() // Prevent input blur
                insertMention(agent)
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarImage
                  src={agent.avatar_url || undefined}
                  alt={agent.display_name || agent.name}
                />
                <AvatarFallback className="text-[10px]">
                  {(agent.display_name || agent.name).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="font-medium truncate flex items-center gap-1">
                  {agent.display_name || agent.name}
                  {agent.is_orchestrator && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-amber-500 text-amber-600 shrink-0">
                      <Crown className="h-2.5 w-2.5 mr-0.5" />
                      Orquestador
                    </Badge>
                  )}
                </span>
                {agent.description && (
                  <span className="text-xs text-muted-foreground truncate">
                    {agent.description}
                  </span>
                )}
              </div>
              <AtSign className="h-3 w-3 text-muted-foreground shrink-0 ml-auto" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
