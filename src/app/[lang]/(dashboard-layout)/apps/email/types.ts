import type { EmailAccount, EmailMessageDetail } from "@/lib/api/client"
import type { DynamicIconNameType } from "@/types"
import type { z } from "zod"
import type { EmailComposerSchema } from "./_schemas/email-composer-schema"
import type { EmailListSearchSchema } from "./_schemas/email-list-search-schema"

export type EmailType = EmailMessageDetail

export interface EmailSidebarItem {
  iconName: DynamicIconNameType
  name: string
  unreadCount: number
}

export type EmailActionType =
  | { type: "getFilteredEmails"; filter: string; currentPage: number }
  | {
      type: "getFilteredEmailsBySearchTerm"
      filter: string
      term: string
      currentPage: number
    }
  | { type: "toggleSelectEmail"; email: EmailMessageDetail }
  | { type: "toggleSelectAllEmail" }
  | { type: "toggleStarEmail"; email: EmailMessageDetail }
  | { type: "setRead"; email: EmailMessageDetail }
  | { type: "setEmails"; emails: EmailMessageDetail[] }
  | { type: "setUnreadCounts"; unreadCounts: Record<string, number> }
  | { type: "setSidebarItems"; items: EmailSidebarItemsType }
  | { type: "addFolder"; folder: EmailSidebarItem }
  | { type: "addLabel"; label: EmailSidebarItem }
  | { type: "removeFolder"; folder: string }
  | { type: "removeLabel"; label: string }

// Re-export API types for convenience
export type { EmailAccount, EmailMessageDetail }

export interface EmailStateType {
  emails: EmailMessageDetail[]
  initialEmails: EmailMessageDetail[]
  selectedEmails: EmailMessageDetail[]
  currentPage: number
  totalPages: number
  totalEmails: number
  unreadCounts: Record<string, number>
  sidebarItems: EmailSidebarItemsType
  isLoading: boolean
}

export interface EmailSidebarItemType {
  iconName: DynamicIconNameType
  name: string
  unreadCount: number
}

export interface EmailSidebarItemsType {
  folders: Array<EmailSidebarItemType>
  labels: Array<EmailSidebarItemType>
}

export interface EmailContextType {
  emailState: EmailStateType
  accounts: EmailAccount[]
  accountsLoading: boolean
  sidebarItems: EmailSidebarItemsType
  isEmailSidebarOpen: boolean
  setIsEmailSidebarOpen: (val: boolean) => void
  handleGetFilteredEmails: (filter: string, currentPage: number) => void
  handleGetFilteredEmailsBySearchTerm: (
    term: string,
    filter: string,
    currentPage: number
  ) => void
  handleToggleSelectEmail: (email: EmailMessageDetail) => void
  handleToggleSelectAllEmails: () => void
  handleToggleStarEmail: (email: EmailMessageDetail) => void
  handleSetRead: (email: EmailMessageDetail) => void
  refetchMessages: () => void
}

export type EmailComposerFormType = z.infer<typeof EmailComposerSchema>

export type EmailListSearchFormType = z.infer<typeof EmailListSearchSchema>
