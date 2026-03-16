"use client"

import { createContext, useCallback, useMemo, useState } from "react"

import type { ReactNode } from "react"
import type {
  EmailContextType,
  EmailMessageDetail,
  EmailSidebarItemsType,
} from "../types"

import {
  useEmailAccounts,
  useEmailMessages,
  useUpdateEmailMessage,
} from "@/lib/api/hooks"

import { PAGE_SIZE } from "../constants"

// Create Email context
export const EmailContext = createContext<EmailContextType | undefined>(
  undefined
)

const SIDEBAR_FOLDERS: EmailSidebarItemsType["folders"] = [
  { iconName: "Archive", name: "inbox", unreadCount: 0 },
  { iconName: "Send", name: "sent", unreadCount: 0 },
  { iconName: "Pencil", name: "draft", unreadCount: 0 },
  { iconName: "Star", name: "starred", unreadCount: 0 },
  { iconName: "Clock", name: "spam", unreadCount: 0 },
  { iconName: "Trash2", name: "trash", unreadCount: 0 },
]

const SIDEBAR_LABELS: EmailSidebarItemsType["labels"] = [
  { iconName: "Tag", name: "personal", unreadCount: 0 },
  { iconName: "Tag", name: "work", unreadCount: 0 },
  { iconName: "Tag", name: "important", unreadCount: 0 },
]

const FOLDER_NAMES = new Set([
  "inbox",
  "sent",
  "draft",
  "starred",
  "spam",
  "trash",
  "archive",
])

export function EmailProvider({ children }: { children: ReactNode }) {
  // Current filter/search/pagination state
  const [currentFilter, setCurrentFilter] = useState("inbox")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedEmails, setSelectedEmails] = useState<EmailMessageDetail[]>([])
  const [isEmailSidebarOpen, setIsEmailSidebarOpen] = useState(false)

  const isFolder = FOLDER_NAMES.has(currentFilter)

  // React Query: fetch accounts
  const { data: accountsData, isLoading: accountsLoading } = useEmailAccounts()
  const accounts = accountsData?.accounts ?? []

  // React Query: fetch messages
  const offset = (currentPage - 1) * PAGE_SIZE
  const {
    data: messagesData,
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useEmailMessages({
    folder: isFolder ? currentFilter : undefined,
    label: !isFolder ? currentFilter : undefined,
    search: searchTerm || undefined,
    limit: PAGE_SIZE,
    offset,
  })

  const emails = messagesData?.items ?? []
  const totalEmails = messagesData?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalEmails / PAGE_SIZE))
  const unreadCounts = messagesData?.unread_counts ?? {}

  // Mutation for updating messages (star, read, etc.)
  const updateMessage = useUpdateEmailMessage()

  // Build sidebar items with unread counts from API
  const sidebarItems = useMemo<EmailSidebarItemsType>(() => {
    const folders = SIDEBAR_FOLDERS.map((f) => ({
      ...f,
      unreadCount: unreadCounts[f.name] ?? 0,
    }))
    const labels = SIDEBAR_LABELS.map((l) => ({
      ...l,
      unreadCount: unreadCounts[l.name] ?? 0,
    }))
    return { folders, labels }
  }, [unreadCounts])

  // Handlers — keep same interface as before for component compatibility
  const handleGetFilteredEmails = useCallback(
    (filter: string, page: number) => {
      setCurrentFilter(filter)
      setCurrentPage(page)
      setSearchTerm("")
      setSelectedEmails([])
    },
    []
  )

  const handleGetFilteredEmailsBySearchTerm = useCallback(
    (term: string, filter: string, page: number) => {
      setSearchTerm(term)
      setCurrentFilter(filter)
      setCurrentPage(page)
    },
    []
  )

  function handleToggleSelectEmail(email: EmailMessageDetail) {
    setSelectedEmails((prev) => {
      const idx = prev.findIndex((e) => e.id === email.id)
      if (idx === -1) return [...prev, email]
      return prev.filter((e) => e.id !== email.id)
    })
  }

  function handleToggleSelectAllEmails() {
    setSelectedEmails((prev) =>
      prev.length === emails.length ? [] : [...emails]
    )
  }

  function handleToggleStarEmail(email: EmailMessageDetail) {
    updateMessage.mutate({
      messageId: email.id,
      data: { is_starred: !email.is_starred },
    })
  }

  function handleSetRead(email: EmailMessageDetail) {
    if (!email.is_read) {
      updateMessage.mutate({
        messageId: email.id,
        data: { is_read: true },
      })
    }
  }

  const emailState = {
    emails,
    initialEmails: emails,
    selectedEmails,
    currentPage,
    totalPages,
    totalEmails,
    unreadCounts,
    sidebarItems,
    isLoading: messagesLoading,
  }

  return (
    <EmailContext.Provider
      value={{
        emailState,
        accounts,
        accountsLoading,
        sidebarItems,
        handleGetFilteredEmails,
        handleGetFilteredEmailsBySearchTerm,
        handleToggleSelectEmail,
        handleToggleSelectAllEmails,
        handleToggleStarEmail,
        isEmailSidebarOpen,
        setIsEmailSidebarOpen,
        handleSetRead,
        refetchMessages,
      }}
    >
      {children}
    </EmailContext.Provider>
  )
}
