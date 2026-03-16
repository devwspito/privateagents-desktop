import type { FileType } from "@/types"
import type { z } from "zod"
import type {
  ApprovalEvent,
  IntegrationSuggestionEvent,
  RecurringTaskSuggestionEvent,
  ToolCallEvent,
} from "./_hooks/use-chat-stream"
import type { FilesUploaderSchema } from "./_schemas/files-uploader-schema"
import type { ImagesUploaderSchema } from "./_schemas/images-uploader-schema"
import type { TextMessageSchema } from "./_schemas/text-message-schema"

// ---------------------------------------------------------------------------
// Orchestration types
// ---------------------------------------------------------------------------
export type OrchestrationStatus =
  | "planning"
  | "executing"
  | "waiting_human"
  | "completed"
  | "failed"
  | "cancelled"

export type OrchestrationStepStatus =
  | "pending"
  | "executing"
  | "waiting_response"
  | "waiting_human"
  | "waiting_human_review"
  | "completed"
  | "failed"

export interface OrchestrationStepState {
  id: string
  stepNumber: number
  action: string
  targetAgentId: string | null
  targetAgentName: string | null
  description: string | null
  status: OrchestrationStepStatus
  messageSent: string | null
  responseReceived: string | null
  error: string | null
  review?: unknown
}

export interface OrchestrationState {
  id: string
  conversationId: string
  status: OrchestrationStatus
  totalSteps: number
  currentStep: number
  steps: OrchestrationStepState[]
  summary: string | null
}

// ---------------------------------------------------------------------------
// Streaming state exposed through context
// ---------------------------------------------------------------------------
export interface ChatStreamState {
  isStreaming: boolean
  streamingTokens: string
  streamingThinking: string | null
  streamingToolCalls: ToolCallEvent[]
  streamingApproval: ApprovalEvent | null
  streamingIntegrationSuggestion: IntegrationSuggestionEvent | null
  streamingRecurringTaskSuggestion: RecurringTaskSuggestionEvent | null
  streamingError: string | null
  orchestration: OrchestrationState | null
  pendingUserMessage: string | null
}

export interface ChatContextType {
  chatState: ChatStateType
  streamState: ChatStreamState
  isChatSidebarOpen: boolean
  setIsChatSidebarOpen: (val: boolean) => void
  handleSelectChat: (chat: ChatType) => void
  handleSelectSession: (sessionKey: string) => void
  handleAddTextMessage: (text: string) => void | Promise<void>
  handleAddImagesMessage: (images: FileType[]) => void
  handleAddFilesMessage: (files: FileType[]) => void
  handleSetUnreadCount: () => void
  handleAbortStream: () => void
  handleNewTask: () => void
  handleApprovalResponse: (approved: boolean) => void
  handleDismissIntegrationSuggestion: () => void
  handleDismissRecurringTaskSuggestion: () => void
  handleConfirmRecurringTask: () => void
  handleRespondToOrchestrationStep: (
    orchestrationId: string,
    stepId: string,
    response: string
  ) => void
}

export type ChatStatusType = "READ" | "DELIVERED" | "SENT" | null

export interface MessageType {
  id: string
  senderId: string
  text?: string
  images?: FileType[]
  files?: FileType[]
  voiceMessage?: FileType
  status: string
  createdAt: Date
  taskId?: string
  type?: "message" | "task_separator"
}

export type NewMessageType = Omit<
  MessageType,
  "id" | "senderId" | "createdAt" | "images" | "files" | "voiceMessage"
> & {
  images?: FileType[]
  files?: FileType[]
  voiceMessage?: FileType
}

export interface UserType {
  id: string
  name: string
  avatar?: string
  status: string
}

export interface LastMessageType {
  content: string
  createdAt: Date
}

export interface ChatType {
  id: string
  lastMessage: LastMessageType
  name: string
  avatar?: string
  status?: string
  messages: MessageType[]
  users: UserType[]
  typingUsers: UserType[]
  unreadCount?: number
  threadType?: "private" | "admin-view" | "thread"
  agentId?: string
  threadLabel?: string
  isSpawned?: boolean
  spawnedBy?: string | null
  callerAgentId?: string | null
  callerAgentName?: string | null
}

export interface ThreadInfo {
  session_key: string
  agent_id: string
  agent_name: string
  agent_avatar?: string
  label: string | null
  last_message: string | null
  last_activity: string | null
  is_spawned: boolean
  spawned_by: string | null
}

export interface ChatStateType {
  chats: ChatType[]
  selectedChat?: ChatType | null
}

export type ChatActionType =
  | {
      type: "addTextMessage"
      text: string
    }
  | {
      type: "addImagesMessage"
      images: FileType[]
    }
  | {
      type: "addFilesMessage"
      files: FileType[]
    }
  | {
      type: "setUnreadCount"
    }
  | {
      type: "selectChat"
      chat: ChatType
    }
  | {
      type: "addUserMessage"
      message: MessageType
    }
  | {
      type: "addAgentMessage"
      message: MessageType
    }
  | {
      type: "updateChatId"
      oldId: string
      newId: string
    }
  | {
      type: "addTaskSeparator"
      message: MessageType
    }
  | {
      type: "resetToNewConversation"
      agentId: string
    }
  | {
      type: "selectSession"
      sessionKey: string
    }
  | {
      type: "syncChats"
      chats: ChatType[]
    }

export type TextMessageFormType = z.infer<typeof TextMessageSchema>

export type FilesUploaderFormType = z.infer<typeof FilesUploaderSchema>

export type ImagesUploaderFormType = z.infer<typeof ImagesUploaderSchema>
