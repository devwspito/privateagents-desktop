"use client"

import type { ChatActionType, ChatStateType, MessageType } from "../types"

export const ChatReducer = (
  state: ChatStateType,
  action: ChatActionType
): ChatStateType => {
  switch (action.type) {
    case "addTextMessage": {
      if (!state.selectedChat) {
        return state // No selected chat, return the current state
      }

      const newMessage: MessageType = {
        id: crypto.randomUUID(), // Generate a unique ID for the message
        senderId: "1", // Assuming "1" represents the current user
        text: action.text, // Set the text content
        status: "DELIVERED", // Message delivery status
        createdAt: new Date(), // Set the current timestamp
      }

      const { id, messages } = state.selectedChat

      const updatedChat = {
        ...state.selectedChat,
        lastMessage: {
          content: action.text, // Update the last message content
          createdAt: newMessage.createdAt, // Update the timestamp
        },
        messages: [newMessage, ...messages], // Add the new message to the top
      }

      const updatedChats = state.chats.map(
        (chat) => (chat.id === id ? updatedChat : chat) // Update the relevant chat
      )

      return { ...state, chats: updatedChats }
    }

    case "addImagesMessage": {
      if (!state.selectedChat) {
        return state // No selected chat, return the current state
      }

      const newMessage: MessageType = {
        id: crypto.randomUUID(),
        senderId: "1",
        images: action.images, // Attach the images to the message
        status: "DELIVERED",
        createdAt: new Date(),
      }

      const { id, messages } = state.selectedChat

      const updatedChat = {
        ...state.selectedChat,
        lastMessage: {
          content: action.images.length > 1 ? "Images" : "Image", // Update the last message to reflect images
          createdAt: newMessage.createdAt,
        },
        messages: [newMessage, ...messages], // Add the new message
      }

      const updatedChats = state.chats.map(
        (chat) => (chat.id === id ? updatedChat : chat) // Update the relevant chat
      )

      return { ...state, chats: updatedChats }
    }

    case "addFilesMessage": {
      if (!state.selectedChat) {
        return state // No selected chat, return the current state
      }

      const newMessage: MessageType = {
        id: crypto.randomUUID(),
        senderId: "1",
        files: action.files, // Attach the files to the message
        status: "DELIVERED",
        createdAt: new Date(),
      }

      const { id, messages } = state.selectedChat

      const updatedChat = {
        ...state.selectedChat,
        lastMessage: {
          content: action.files.length > 1 ? "Files" : "File", // Update the last message to reflect files
          createdAt: newMessage.createdAt,
        },
        messages: [newMessage, ...messages], // Add the new message
      }

      const updatedChats = state.chats.map(
        (chat) => (chat.id === id ? updatedChat : chat) // Update the relevant chat
      )

      return { ...state, chats: updatedChats }
    }

    case "setUnreadCount": {
      if (!state.selectedChat) {
        return state // No selected chat, return the current state
      }

      const { id } = state.selectedChat

      const updatedChat = {
        ...state.selectedChat,
        unreadCount: 0, // Reset unread count for the selected chat
      }

      const updatedChats = state.chats.map(
        (chat) => (chat.id === id ? updatedChat : chat) // Update the relevant chat
      )

      return { ...state, chats: updatedChats }
    }

    case "selectChat": {
      return { ...state, selectedChat: action.chat } // Set the selected chat
    }

    case "addUserMessage": {
      if (!state.selectedChat) return state

      const { id, messages } = state.selectedChat
      const updatedChat = {
        ...state.selectedChat,
        lastMessage: {
          content: action.message.text || "",
          createdAt: action.message.createdAt,
        },
        messages: [action.message, ...messages],
      }
      const updatedChats = state.chats.map((chat) =>
        chat.id === id ? updatedChat : chat
      )
      return { ...state, chats: updatedChats, selectedChat: updatedChat }
    }

    case "addAgentMessage": {
      if (!state.selectedChat) return state

      const { id, messages } = state.selectedChat
      const updatedChat = {
        ...state.selectedChat,
        lastMessage: {
          content: action.message.text || "",
          createdAt: action.message.createdAt,
        },
        messages: [action.message, ...messages],
      }
      const updatedChats = state.chats.map((chat) =>
        chat.id === id ? updatedChat : chat
      )
      return { ...state, chats: updatedChats, selectedChat: updatedChat }
    }

    case "updateChatId": {
      // When a new conversation is created, update the placeholder ID
      const updatedChats = state.chats.map((chat) =>
        chat.id === action.oldId ? { ...chat, id: action.newId } : chat
      )
      const updatedSelectedChat =
        state.selectedChat?.id === action.oldId
          ? { ...state.selectedChat, id: action.newId }
          : state.selectedChat
      return {
        ...state,
        chats: updatedChats,
        selectedChat: updatedSelectedChat,
      }
    }

    case "addTaskSeparator": {
      if (!state.selectedChat) return state
      const { id, messages } = state.selectedChat
      const updatedChat = {
        ...state.selectedChat,
        messages: [action.message, ...messages],
      }
      const updatedChats = state.chats.map((chat) =>
        chat.id === id ? updatedChat : chat
      )
      return { ...state, chats: updatedChats, selectedChat: updatedChat }
    }

    case "resetToNewConversation": {
      if (!state.selectedChat) return state
      const oldId = state.selectedChat.id
      const newId = `new:${action.agentId}`
      const updatedChat = { ...state.selectedChat, id: newId, messages: [] }
      const updatedChats = state.chats.map((chat) =>
        chat.id === oldId ? updatedChat : chat
      )
      return { ...state, chats: updatedChats, selectedChat: updatedChat }
    }

    case "selectSession": {
      // Switch the current chat to a different OpenClaw session
      if (!state.selectedChat) return state
      const updatedChat = {
        ...state.selectedChat,
        id: action.sessionKey,
        messages: [], // Clear local messages, API history will be fetched
      }
      const updatedChats = state.chats.map((chat) =>
        chat.id === state.selectedChat!.id ? updatedChat : chat
      )
      return { ...state, chats: updatedChats, selectedChat: updatedChat }
    }

    case "syncChats": {
      // Merge new chat data from API while preserving selectedChat's local state
      const newChats = action.chats
      const selectedId = state.selectedChat?.id

      if (!selectedId) {
        return { ...state, chats: newChats }
      }

      // Preserve selected chat's local state (messages, etc.)
      const selectedInNew = newChats.find((c) => c.id === selectedId)
      const preservedSelected = state.selectedChat
        ? {
            ...state.selectedChat,
            // Update metadata from API but keep local messages
            ...(selectedInNew
              ? {
                  name: selectedInNew.name,
                  avatar: selectedInNew.avatar,
                  threadLabel: selectedInNew.threadLabel,
                  lastMessage: state.selectedChat.messages.length > 0
                    ? state.selectedChat.lastMessage
                    : selectedInNew.lastMessage,
                }
              : {}),
          }
        : null

      // Build merged list
      const mergedChats = newChats.map((c) =>
        c.id === selectedId && preservedSelected ? preservedSelected : c
      )

      // If selected chat is not yet in API data, keep it.
      // Covers both "new:*" placeholders AND freshly created sessions
      // (API may not return the new session_key immediately after creation).
      if (preservedSelected && !selectedInNew) {
        mergedChats.push(preservedSelected)
      }

      return {
        ...state,
        chats: mergedChats,
        selectedChat: preservedSelected,
      }
    }

    default:
      return state // Return the current state for unknown actions
  }
}
