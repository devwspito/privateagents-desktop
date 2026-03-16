import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { ThreadMessage, ThreadParticipant } from "../thread-view"

import { ThreadView } from "../thread-view"

describe("ThreadView", () => {
  const currentUser: ThreadParticipant = {
    id: "user-1",
    name: "Current User",
    avatar: undefined,
  }

  const otherUser: ThreadParticipant = {
    id: "user-2",
    name: "Other User",
    avatar: undefined,
  }

  const defaultMessages: ThreadMessage[] = [
    {
      id: "msg-1",
      senderId: "user-2",
      sender: otherUser,
      content: "Hello there!",
      timestamp: new Date("2024-01-15T10:00:00Z"),
    },
    {
      id: "msg-2",
      senderId: "user-1",
      sender: currentUser,
      content: "Hi! How are you?",
      timestamp: new Date("2024-01-15T10:05:00Z"),
    },
  ]

  const mockOnSendMessage = vi.fn()

  beforeEach(() => {
    mockOnSendMessage.mockClear()
  })

  describe("rendering", () => {
    it("renders all messages", () => {
      render(<ThreadView messages={defaultMessages} currentUserId="user-1" />)
      expect(screen.getByText("Hello there!")).toBeInTheDocument()
      expect(screen.getByText("Hi! How are you?")).toBeInTheDocument()
    })

    it("renders messages in chronological order", () => {
      const messages: ThreadMessage[] = [
        {
          id: "msg-3",
          senderId: "user-2",
          content: "Third message",
          timestamp: new Date("2024-01-15T12:00:00Z"),
        },
        {
          id: "msg-1",
          senderId: "user-2",
          content: "First message",
          timestamp: new Date("2024-01-15T10:00:00Z"),
        },
        {
          id: "msg-2",
          senderId: "user-2",
          content: "Second message",
          timestamp: new Date("2024-01-15T11:00:00Z"),
        },
      ]
      render(<ThreadView messages={messages} currentUserId="user-1" />)

      const contents = screen.getAllByText(/message/)
      expect(contents[0]).toHaveTextContent("First message")
      expect(contents[1]).toHaveTextContent("Second message")
      expect(contents[2]).toHaveTextContent("Third message")
    })

    it("renders empty state when no messages", () => {
      render(<ThreadView messages={[]} currentUserId="user-1" />)
      expect(screen.getByText("No messages yet")).toBeInTheDocument()
    })

    it("renders custom empty message", () => {
      render(
        <ThreadView
          messages={[]}
          currentUserId="user-1"
          emptyMessage={<span>Start the conversation!</span>}
        />
      )
      expect(screen.getByText("Start the conversation!")).toBeInTheDocument()
    })
  })

  describe("thread header", () => {
    it("renders thread name", () => {
      render(
        <ThreadView
          messages={defaultMessages}
          currentUserId="user-1"
          threadName="Team Chat"
        />
      )
      expect(screen.getByText("Team Chat")).toBeInTheDocument()
    })

    it("renders participant count", () => {
      render(
        <ThreadView
          messages={defaultMessages}
          currentUserId="user-1"
          threadName="Team Chat"
          participants={[currentUser, otherUser]}
        />
      )
      expect(screen.getByText("2 participants")).toBeInTheDocument()
    })

    it("renders singular participant", () => {
      render(
        <ThreadView
          messages={defaultMessages}
          currentUserId="user-1"
          threadName="Chat"
          participants={[currentUser]}
        />
      )
      expect(screen.getByText("1 participant")).toBeInTheDocument()
    })

    it("renders header actions", () => {
      render(
        <ThreadView
          messages={defaultMessages}
          currentUserId="user-1"
          threadName="Chat"
          headerActions={<button type="button">Action</button>}
        />
      )
      expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument()
    })

    it("does not render header when no threadName or headerActions", () => {
      const { container } = render(
        <ThreadView messages={defaultMessages} currentUserId="user-1" />
      )
      expect(container.querySelector('[data-slot="card-header"]')).toBeNull()
    })
  })

  describe("message layout", () => {
    it("aligns current user messages to the right", () => {
      const { container } = render(
        <ThreadView messages={defaultMessages} currentUserId="user-1" />
      )
      const messageWrappers = container.querySelectorAll(".flex.gap-2")
      let currentUserWrapper: Element | null = null
      messageWrappers.forEach((el) => {
        if (el.textContent?.includes("Hi! How are you?")) {
          currentUserWrapper = el
        }
      })
      expect((currentUserWrapper as HTMLElement | null)?.className).toMatch(/justify-end/)
    })

    it("aligns other user messages to the left", () => {
      const { container } = render(
        <ThreadView messages={defaultMessages} currentUserId="user-1" />
      )
      const messageWrappers = container.querySelectorAll(".flex.gap-2")
      let otherUserWrapper: Element | null = null
      messageWrappers.forEach((el) => {
        if (el.textContent?.includes("Hello there!")) {
          otherUserWrapper = el
        }
      })
      expect((otherUserWrapper as HTMLElement | null)?.className).toMatch(/justify-start/)
    })

    it("shows sender name for other users", () => {
      render(<ThreadView messages={defaultMessages} currentUserId="user-1" />)
      expect(screen.getByText("Other User")).toBeInTheDocument()
    })

    it("does not show sender name for current user", () => {
      const { container } = render(
        <ThreadView messages={defaultMessages} currentUserId="user-1" />
      )
      const currentUserMessage = container.querySelector(
        '[data-slot="card-content"]'
      )
      expect(currentUserMessage?.textContent).not.toMatch(
        /Current User.*Hi! How are you?/
      )
    })
  })

  describe("date separators", () => {
    it("shows 'Today' for today's messages", () => {
      const today = new Date()
      const messages: ThreadMessage[] = [
        {
          id: "msg-1",
          senderId: "user-2",
          content: "Today's message",
          timestamp: today,
        },
      ]
      render(<ThreadView messages={messages} currentUserId="user-1" />)
      expect(screen.getByText("Today")).toBeInTheDocument()
    })

    it("shows 'Yesterday' for yesterday's messages", () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const messages: ThreadMessage[] = [
        {
          id: "msg-1",
          senderId: "user-2",
          content: "Yesterday's message",
          timestamp: yesterday,
        },
      ]
      render(<ThreadView messages={messages} currentUserId="user-1" />)
      expect(screen.getByText("Yesterday")).toBeInTheDocument()
    })

    it("groups messages by date", () => {
      const day1 = new Date("2024-01-15T10:00:00Z")
      const day2 = new Date("2024-01-16T10:00:00Z")
      const messages: ThreadMessage[] = [
        {
          id: "msg-1",
          senderId: "user-2",
          content: "Day 1 message",
          timestamp: day1,
        },
        {
          id: "msg-2",
          senderId: "user-2",
          content: "Day 2 message",
          timestamp: day2,
        },
      ]
      render(<ThreadView messages={messages} currentUserId="user-1" />)
      const dateSeparators = screen.getAllByText(
        /Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/
      )
      expect(dateSeparators.length).toBe(2)
    })
  })

  describe("send message", () => {
    it("renders message input by default", () => {
      render(<ThreadView messages={defaultMessages} currentUserId="user-1" />)
      expect(
        screen.getByPlaceholderText("Type a message...")
      ).toBeInTheDocument()
    })

    it("hides input when showInput is false", () => {
      render(
        <ThreadView
          messages={defaultMessages}
          currentUserId="user-1"
          showInput={false}
        />
      )
      expect(
        screen.queryByPlaceholderText("Type a message...")
      ).not.toBeInTheDocument()
    })

    it("renders custom input placeholder", () => {
      render(
        <ThreadView
          messages={defaultMessages}
          currentUserId="user-1"
          inputPlaceholder="Write something..."
        />
      )
      expect(
        screen.getByPlaceholderText("Write something...")
      ).toBeInTheDocument()
    })

    it("calls onSendMessage when form is submitted", () => {
      render(
        <ThreadView
          messages={defaultMessages}
          currentUserId="user-1"
          onSendMessage={mockOnSendMessage}
        />
      )

      const input = screen.getByPlaceholderText("Type a message...")
      fireEvent.change(input, { target: { value: "New message" } })
      fireEvent.submit(input.closest("form")!)

      expect(mockOnSendMessage).toHaveBeenCalledWith("New message")
    })

    it("does not call onSendMessage with empty message", () => {
      render(
        <ThreadView
          messages={defaultMessages}
          currentUserId="user-1"
          onSendMessage={mockOnSendMessage}
        />
      )

      const input = screen.getByPlaceholderText("Type a message...")
      fireEvent.change(input, { target: { value: "   " } })
      fireEvent.submit(input.closest("form")!)

      expect(mockOnSendMessage).not.toHaveBeenCalled()
    })

    it("clears input after sending", () => {
      render(
        <ThreadView
          messages={defaultMessages}
          currentUserId="user-1"
          onSendMessage={mockOnSendMessage}
        />
      )

      const input = screen.getByPlaceholderText(
        "Type a message..."
      ) as HTMLInputElement
      fireEvent.change(input, { target: { value: "New message" } })
      fireEvent.submit(input.closest("form")!)

      expect(input.value).toBe("")
    })
  })

  describe("accessibility", () => {
    it("has aria-label for send button", () => {
      render(<ThreadView messages={defaultMessages} currentUserId="user-1" />)
      expect(
        screen.getByRole("button", { name: "Send message" })
      ).toBeInTheDocument()
    })
  })

  describe("custom className", () => {
    it("applies custom className", () => {
      const { container } = render(
        <ThreadView
          messages={defaultMessages}
          currentUserId="user-1"
          className="custom-thread"
        />
      )
      expect(container.querySelector(".custom-thread")).toBeInTheDocument()
    })
  })

  describe("string timestamps", () => {
    it("handles string timestamps", () => {
      const messages: ThreadMessage[] = [
        {
          id: "msg-1",
          senderId: "user-2",
          content: "Message with string timestamp",
          timestamp: "2024-01-15T10:00:00Z",
        },
      ]
      render(<ThreadView messages={messages} currentUserId="user-1" />)
      expect(
        screen.getByText("Message with string timestamp")
      ).toBeInTheDocument()
    })
  })

  describe("participants lookup", () => {
    it("looks up sender from participants array", () => {
      const messages: ThreadMessage[] = [
        {
          id: "msg-1",
          senderId: "user-2",
          content: "Message without sender object",
          timestamp: new Date(),
        },
      ]
      render(
        <ThreadView
          messages={messages}
          currentUserId="user-1"
          participants={[currentUser, otherUser]}
        />
      )
      expect(screen.getByText("Other User")).toBeInTheDocument()
    })
  })

  describe("ReactNode content", () => {
    it("renders ReactNode content", () => {
      const messages: ThreadMessage[] = [
        {
          id: "msg-1",
          senderId: "user-2",
          content: (
            <div>
              <strong>Bold</strong> message
            </div>
          ),
          timestamp: new Date(),
        },
      ]
      render(<ThreadView messages={messages} currentUserId="user-1" />)
      expect(screen.getByText("Bold")).toBeInTheDocument()
      expect(screen.getByText("message")).toBeInTheDocument()
    })
  })
})
