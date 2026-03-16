import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { MessageMetadata } from "../message-card"

import { MessageCard } from "../message-card"

describe("MessageCard", () => {
  const defaultMetadata: MessageMetadata = {
    id: "msg-123",
    sender: {
      id: "user-1",
      name: "John Doe",
      avatar: undefined,
    },
    timestamp: new Date("2024-01-15T10:30:00Z"),
  }

  const mockOnMetadataToggle = vi.fn()

  beforeEach(() => {
    mockOnMetadataToggle.mockClear()
  })

  describe("rendering", () => {
    it("renders message content", () => {
      render(<MessageCard content="Test message" metadata={defaultMetadata} />)
      expect(screen.getByText("Test message")).toBeInTheDocument()
    })

    it("renders sender name", () => {
      render(<MessageCard content="Test" metadata={defaultMetadata} />)
      expect(screen.getByText("John Doe")).toBeInTheDocument()
    })

    it("renders sender initials in avatar fallback", () => {
      render(<MessageCard content="Test" metadata={defaultMetadata} />)
      expect(screen.getByText("JD")).toBeInTheDocument()
    })

    it("renders sender avatar component when avatar URL is provided", () => {
      const metadataWithAvatar: MessageMetadata = {
        ...defaultMetadata,
        sender: {
          ...defaultMetadata.sender!,
          avatar: "https://example.com/avatar.jpg",
        },
      }
      const { container } = render(
        <MessageCard content="Test" metadata={metadataWithAvatar} />
      )
      const avatar = container.querySelector('[data-slot="avatar"]')
      expect(avatar).toBeTruthy()
      expect(screen.getByText("JD")).toBeInTheDocument()
    })

    it("hides avatar when showAvatar is false", () => {
      render(
        <MessageCard
          content="Test"
          metadata={defaultMetadata}
          showAvatar={false}
        />
      )
      expect(screen.queryByText("JD")).not.toBeInTheDocument()
    })

    it("renders priority badge for medium priority", () => {
      const metadata: MessageMetadata = {
        ...defaultMetadata,
        priority: "medium",
      }
      render(<MessageCard content="Test" metadata={metadata} />)
      expect(screen.getByText("medium")).toBeInTheDocument()
    })

    it("renders priority badge for high priority with destructive variant", () => {
      const metadata: MessageMetadata = { ...defaultMetadata, priority: "high" }
      render(<MessageCard content="Test" metadata={metadata} />)
      expect(screen.getByText("high")).toBeInTheDocument()
    })

    it("renders priority badge for low priority with secondary variant", () => {
      const metadata: MessageMetadata = { ...defaultMetadata, priority: "low" }
      render(<MessageCard content="Test" metadata={metadata} />)
      expect(screen.getByText("low")).toBeInTheDocument()
    })

    it("renders tags when provided", () => {
      const metadata: MessageMetadata = {
        ...defaultMetadata,
        tags: ["urgent", "follow-up"],
      }
      render(<MessageCard content="Test" metadata={metadata} />)

      fireEvent.click(screen.getByText("Metadata"))

      expect(screen.getByText("urgent")).toBeInTheDocument()
      expect(screen.getByText("follow-up")).toBeInTheDocument()
    })
  })

  describe("expandable metadata", () => {
    it("shows metadata toggle button", () => {
      render(<MessageCard content="Test" metadata={defaultMetadata} />)
      expect(screen.getByText("Metadata")).toBeInTheDocument()
    })

    it("expands metadata section when clicked", () => {
      render(<MessageCard content="Test" metadata={defaultMetadata} />)

      const toggle = screen.getByText("Metadata")
      fireEvent.click(toggle)

      expect(screen.getByText("ID:")).toBeInTheDocument()
      expect(screen.getByText("msg-123")).toBeInTheDocument()
    })

    it("calls onMetadataToggle when metadata is toggled", () => {
      render(
        <MessageCard
          content="Test"
          metadata={defaultMetadata}
          onMetadataToggle={mockOnMetadataToggle}
        />
      )

      fireEvent.click(screen.getByText("Metadata"))
      expect(mockOnMetadataToggle).toHaveBeenCalledWith(true)
    })

    it("is collapsed by default", () => {
      render(<MessageCard content="Test" metadata={defaultMetadata} />)
      expect(screen.queryByText("ID:")).not.toBeInTheDocument()
    })

    it("is expanded by default when defaultExpanded is true", () => {
      render(
        <MessageCard
          content="Test"
          metadata={defaultMetadata}
          defaultExpanded
        />
      )
      expect(screen.getByText("ID:")).toBeInTheDocument()
    })

    it("shows channel in metadata when provided", () => {
      const metadata: MessageMetadata = { ...defaultMetadata, channel: "email" }
      render(<MessageCard content="Test" metadata={metadata} defaultExpanded />)

      expect(screen.getByText("Channel:")).toBeInTheDocument()
      expect(screen.getByText("email")).toBeInTheDocument()
    })

    it("shows language in metadata when provided", () => {
      const metadata: MessageMetadata = {
        ...defaultMetadata,
        language: "en-US",
      }
      render(<MessageCard content="Test" metadata={metadata} defaultExpanded />)

      expect(screen.getByText("Language:")).toBeInTheDocument()
      expect(screen.getByText("en-US")).toBeInTheDocument()
    })

    it("shows additional data in metadata when provided", () => {
      const metadata: MessageMetadata = {
        ...defaultMetadata,
        additionalData: { version: "1.0", source: "api" },
      }
      render(<MessageCard content="Test" metadata={metadata} defaultExpanded />)

      expect(screen.getByText("version:")).toBeInTheDocument()
      expect(screen.getByText("1.0")).toBeInTheDocument()
      expect(screen.getByText("source:")).toBeInTheDocument()
      expect(screen.getByText("api")).toBeInTheDocument()
    })
  })

  describe("without sender", () => {
    it("renders without sender information", () => {
      const metadata: MessageMetadata = {
        id: "msg-123",
        timestamp: new Date(),
      }
      render(<MessageCard content="Test" metadata={metadata} />)
      expect(screen.getByText("Test")).toBeInTheDocument()
    })

    it("does not show sender in metadata when not provided", () => {
      const metadata: MessageMetadata = {
        id: "msg-123",
        timestamp: new Date(),
      }
      render(<MessageCard content="Test" metadata={metadata} defaultExpanded />)
      expect(screen.queryByText("Sender:")).not.toBeInTheDocument()
    })
  })

  describe("accessibility", () => {
    it("has proper aria-label for metadata toggle", () => {
      render(<MessageCard content="Test" metadata={defaultMetadata} />)

      const button = screen.getByRole("button", { name: /expand metadata/i })
      expect(button).toBeInTheDocument()
    })

    it("updates aria-label when expanded", () => {
      render(
        <MessageCard
          content="Test"
          metadata={defaultMetadata}
          defaultExpanded
        />
      )

      const button = screen.getByRole("button", { name: /collapse metadata/i })
      expect(button).toBeInTheDocument()
    })
  })

  describe("custom className", () => {
    it("applies custom className", () => {
      const { container } = render(
        <MessageCard
          content="Test"
          metadata={defaultMetadata}
          className="custom-class"
        />
      )
      expect(container.querySelector(".custom-class")).toBeInTheDocument()
    })
  })

  describe("content types", () => {
    it("renders string content", () => {
      render(<MessageCard content="Simple string" metadata={defaultMetadata} />)
      expect(screen.getByText("Simple string")).toBeInTheDocument()
    })

    it("renders ReactNode content", () => {
      render(
        <MessageCard
          content={
            <div>
              <strong>Bold</strong> text
            </div>
          }
          metadata={defaultMetadata}
        />
      )
      expect(screen.getByText("Bold")).toBeInTheDocument()
      expect(screen.getByText("text")).toBeInTheDocument()
    })
  })

  describe("edge cases", () => {
    it("handles empty tags array", () => {
      const metadata: MessageMetadata = { ...defaultMetadata, tags: [] }
      render(<MessageCard content="Test" metadata={metadata} defaultExpanded />)
      expect(screen.queryByRole("badge")).not.toBeInTheDocument()
    })

    it("handles empty additional data", () => {
      const metadata: MessageMetadata = {
        ...defaultMetadata,
        additionalData: {},
      }
      render(<MessageCard content="Test" metadata={metadata} defaultExpanded />)
      expect(screen.queryByText("version:")).not.toBeInTheDocument()
    })

    it("handles string timestamp", () => {
      const metadata: MessageMetadata = {
        ...defaultMetadata,
        timestamp: "2024-01-15T10:30:00Z",
      }
      render(<MessageCard content="Test" metadata={metadata} />)
      expect(screen.getByText("2024-01-15T10:30:00Z")).toBeInTheDocument()
    })
  })
})
