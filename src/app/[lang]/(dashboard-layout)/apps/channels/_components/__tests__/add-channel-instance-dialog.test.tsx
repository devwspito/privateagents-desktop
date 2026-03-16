import { renderWithQueryClient } from "@/test/utils"
import { screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { AddChannelInstanceDialog } from "../add-channel-instance-dialog"

const mockAgents = [
  { id: "agent-1", name: "Sales Agent" },
  { id: "agent-2", name: "Support Agent" },
]

describe("AddChannelInstanceDialog", () => {
  it("renders the dialog when open", () => {
    const mockOnOpenChange = vi.fn()
    const mockOnSubmit = vi.fn()

    renderWithQueryClient(
      <AddChannelInstanceDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        agents={mockAgents}
      />
    )

    expect(screen.getByText("Add Channel Instance")).toBeInTheDocument()
    expect(
      screen.getByText("Connect a new messaging platform for your agents")
    ).toBeInTheDocument()
  })

  it("renders step indicator", () => {
    const mockOnOpenChange = vi.fn()
    const mockOnSubmit = vi.fn()

    renderWithQueryClient(
      <AddChannelInstanceDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        agents={mockAgents}
      />
    )

    expect(screen.getByText("Select Channel")).toBeInTheDocument()
    expect(screen.getByText("Authentication")).toBeInTheDocument()
    expect(screen.getByText("Routing")).toBeInTheDocument()
    expect(screen.getByText("Review")).toBeInTheDocument()
  })

  it("renders channel options on first step", () => {
    const mockOnOpenChange = vi.fn()
    const mockOnSubmit = vi.fn()

    renderWithQueryClient(
      <AddChannelInstanceDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        agents={mockAgents}
      />
    )

    expect(screen.getByText("WhatsApp")).toBeInTheDocument()
    expect(screen.getByText("Telegram")).toBeInTheDocument()
    expect(screen.getByText("Slack")).toBeInTheDocument()
    expect(screen.getByText("Discord")).toBeInTheDocument()
  })

  it("does not render when closed", () => {
    const mockOnOpenChange = vi.fn()
    const mockOnSubmit = vi.fn()

    renderWithQueryClient(
      <AddChannelInstanceDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        agents={mockAgents}
      />
    )

    expect(screen.queryByText("Add Channel Instance")).not.toBeInTheDocument()
  })

  it("has back button disabled on first step", () => {
    const mockOnOpenChange = vi.fn()
    const mockOnSubmit = vi.fn()

    renderWithQueryClient(
      <AddChannelInstanceDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        agents={mockAgents}
      />
    )

    const backButton = screen.getByRole("button", { name: /back/i })
    expect(backButton).toBeDisabled()
  })
})
