import { mockToast } from "@/test/setup"
import {
  mockUser2 as _mockUser2,
  mockDelegation,
  mockExpiredDelegation,
  mockUser,
  mockUsersResponse,
  renderWithQueryClient,
} from "@/test/utils"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import * as apiHooks from "@/lib/api"

import { DelegationSection } from "../delegation-section"

vi.mock("@/lib/api", () => ({
  useDelegations: vi.fn(),
  useUsers: vi.fn(),
  useCreateDelegation: vi.fn(),
  useRevokeDelegation: vi.fn(),
}))

const mockedUseDelegations = vi.mocked(apiHooks.useDelegations)
const mockedUseUsers = vi.mocked(apiHooks.useUsers)
const mockedUseCreateDelegation = vi.mocked(apiHooks.useCreateDelegation)
const mockedUseRevokeDelegation = vi.mocked(apiHooks.useRevokeDelegation)

const mockCreateDelegationMutate = vi.fn()
const mockCreateDelegationMutateAsync = vi.fn()
const mockRevokeDelegationMutateAsync = vi.fn()

describe("DelegationSection", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateDelegationMutate.mockReset()
    mockCreateDelegationMutateAsync.mockReset()
    mockRevokeDelegationMutateAsync.mockReset()
    mockToast.mockReset()
  })

  it("renders empty state when no active delegations", () => {
    mockedUseDelegations.mockReturnValue({
      data: { items: [], total: 0 },
    } as unknown as ReturnType<typeof apiHooks.useDelegations>)
    mockedUseUsers.mockReturnValue({
      data: mockUsersResponse,
    } as unknown as ReturnType<typeof apiHooks.useUsers>)
    mockedUseCreateDelegation.mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useCreateDelegation>)
    mockedUseRevokeDelegation.mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useRevokeDelegation>)

    renderWithQueryClient(<DelegationSection user={mockUser} />)

    expect(screen.getByText("No active delegations")).toBeInTheDocument()
    expect(
      screen.getByText(/add a delegate to allow them to act on your behalf/i)
    ).toBeInTheDocument()
  })

  it("displays active delegations", () => {
    mockedUseDelegations.mockReturnValue({
      data: { items: [mockDelegation], total: 1 },
    } as unknown as ReturnType<typeof apiHooks.useDelegations>)
    mockedUseUsers.mockReturnValue({
      data: mockUsersResponse,
    } as unknown as ReturnType<typeof apiHooks.useUsers>)
    mockedUseCreateDelegation.mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useCreateDelegation>)
    mockedUseRevokeDelegation.mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useRevokeDelegation>)

    renderWithQueryClient(<DelegationSection user={mockUser} />)

    expect(screen.getByText("Test User 2")).toBeInTheDocument()
    expect(screen.getByText("Approvals Only")).toBeInTheDocument()
  })

  it("displays inactive delegations in separate section", () => {
    mockedUseDelegations.mockReturnValue({
      data: { items: [mockExpiredDelegation], total: 1 },
    } as unknown as ReturnType<typeof apiHooks.useDelegations>)
    mockedUseUsers.mockReturnValue({
      data: mockUsersResponse,
    } as unknown as ReturnType<typeof apiHooks.useUsers>)
    mockedUseCreateDelegation.mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useCreateDelegation>)
    mockedUseRevokeDelegation.mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useRevokeDelegation>)

    renderWithQueryClient(<DelegationSection user={mockUser} />)

    expect(screen.getByText("Inactive Delegations")).toBeInTheDocument()
    expect(screen.getByText("expired")).toBeInTheDocument()
  })

  it("opens create delegation dialog when Add Delegate is clicked", async () => {
    const user = userEvent.setup()
    mockedUseDelegations.mockReturnValue({
      data: { items: [], total: 0 },
    } as unknown as ReturnType<typeof apiHooks.useDelegations>)
    mockedUseUsers.mockReturnValue({
      data: mockUsersResponse,
    } as unknown as ReturnType<typeof apiHooks.useUsers>)
    mockedUseCreateDelegation.mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useCreateDelegation>)
    mockedUseRevokeDelegation.mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useRevokeDelegation>)

    renderWithQueryClient(<DelegationSection user={mockUser} />)

    const addButton = screen.getByRole("button", { name: /add delegate/i })
    await user.click(addButton)

    expect(screen.getByText("Create Delegation")).toBeInTheDocument()
    expect(
      screen.getByText(/allow another user to act on your behalf/i)
    ).toBeInTheDocument()
  })

  it("excludes current user from delegate options", async () => {
    const user = userEvent.setup()
    mockedUseDelegations.mockReturnValue({
      data: { items: [], total: 0 },
    } as unknown as ReturnType<typeof apiHooks.useDelegations>)
    mockedUseUsers.mockReturnValue({
      data: mockUsersResponse,
    } as unknown as ReturnType<typeof apiHooks.useUsers>)
    mockedUseCreateDelegation.mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useCreateDelegation>)
    mockedUseRevokeDelegation.mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useRevokeDelegation>)

    renderWithQueryClient(<DelegationSection user={mockUser} />)

    const addButton = screen.getByRole("button", { name: /add delegate/i })
    await user.click(addButton)

    const selectTrigger = screen.getByPlaceholderText("Select a user")
    await user.click(selectTrigger)

    await waitFor(() => {
      expect(screen.getByText("Test User 2")).toBeInTheDocument()
      expect(screen.queryByText("Test User")).not.toBeInTheDocument()
    })
  })

  it("creates delegation successfully", async () => {
    const user = userEvent.setup()
    mockCreateDelegationMutateAsync.mockResolvedValue(mockDelegation)

    mockedUseDelegations.mockReturnValue({
      data: { items: [], total: 0 },
    } as unknown as ReturnType<typeof apiHooks.useDelegations>)
    mockedUseUsers.mockReturnValue({
      data: mockUsersResponse,
    } as unknown as ReturnType<typeof apiHooks.useUsers>)
    mockedUseCreateDelegation.mockReturnValue({
      mutateAsync: mockCreateDelegationMutateAsync,
      isPending: false,
      isSuccess: false,
      isError: false,
    } as unknown as ReturnType<typeof apiHooks.useCreateDelegation>)
    mockedUseRevokeDelegation.mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useRevokeDelegation>)

    renderWithQueryClient(<DelegationSection user={mockUser} />)

    const addButton = screen.getByRole("button", { name: /add delegate/i })
    await user.click(addButton)

    const selectTrigger = screen.getByPlaceholderText("Select a user")
    await user.click(selectTrigger)

    const delegateOption = screen.getByText("Test User 2")
    await user.click(delegateOption)

    const scopeTrigger = screen.getByPlaceholderText("Select scope")
    await user.click(scopeTrigger)

    const approvalsOption = screen.getByText("Approvals Only")
    await user.click(approvalsOption)

    const submitButton = screen.getByRole("button", {
      name: /create delegation/i,
    })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockCreateDelegationMutateAsync).toHaveBeenCalledWith({
        delegate_id: "user-2",
        scope: "approvals",
        expires_at: undefined,
      })
    })

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Delegation created",
        })
      )
    })
  })

  it("handles delegation creation error", async () => {
    const user = userEvent.setup()
    mockCreateDelegationMutateAsync.mockRejectedValue(
      new Error("Failed to create delegation")
    )

    mockedUseDelegations.mockReturnValue({
      data: { items: [], total: 0 },
    } as unknown as ReturnType<typeof apiHooks.useDelegations>)
    mockedUseUsers.mockReturnValue({
      data: mockUsersResponse,
    } as unknown as ReturnType<typeof apiHooks.useUsers>)
    mockedUseCreateDelegation.mockReturnValue({
      mutateAsync: mockCreateDelegationMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof apiHooks.useCreateDelegation>)
    mockedUseRevokeDelegation.mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useRevokeDelegation>)

    renderWithQueryClient(<DelegationSection user={mockUser} />)

    const addButton = screen.getByRole("button", { name: /add delegate/i })
    await user.click(addButton)

    const selectTrigger = screen.getByPlaceholderText("Select a user")
    await user.click(selectTrigger)

    const delegateOption = screen.getByText("Test User 2")
    await user.click(delegateOption)

    const scopeTrigger = screen.getByPlaceholderText("Select scope")
    await user.click(scopeTrigger)

    const fullAccessOption = screen.getByText("Full Access")
    await user.click(fullAccessOption)

    const submitButton = screen.getByRole("button", {
      name: /create delegation/i,
    })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "destructive",
          title: "Failed to create delegation",
        })
      )
    })
  })

  it("revokes delegation successfully", async () => {
    const user = userEvent.setup()
    mockRevokeDelegationMutateAsync.mockResolvedValue({ status: "revoked" })

    mockedUseDelegations.mockReturnValue({
      data: { items: [mockDelegation], total: 1 },
    } as unknown as ReturnType<typeof apiHooks.useDelegations>)
    mockedUseUsers.mockReturnValue({
      data: mockUsersResponse,
    } as unknown as ReturnType<typeof apiHooks.useUsers>)
    mockedUseCreateDelegation.mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useCreateDelegation>)
    mockedUseRevokeDelegation.mockReturnValue({
      mutateAsync: mockRevokeDelegationMutateAsync,
    } as unknown as ReturnType<typeof apiHooks.useRevokeDelegation>)

    renderWithQueryClient(<DelegationSection user={mockUser} />)

    const revokeButton = screen.getByRole("button", { name: "" })
    await user.click(revokeButton)

    await waitFor(() => {
      expect(mockRevokeDelegationMutateAsync).toHaveBeenCalledWith(
        "delegation-1"
      )
    })

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Delegation revoked",
        })
      )
    })
  })

  it("handles revoke delegation error", async () => {
    const user = userEvent.setup()
    mockRevokeDelegationMutateAsync.mockRejectedValue(
      new Error("Failed to revoke")
    )

    mockedUseDelegations.mockReturnValue({
      data: { items: [mockDelegation], total: 1 },
    } as unknown as ReturnType<typeof apiHooks.useDelegations>)
    mockedUseUsers.mockReturnValue({
      data: mockUsersResponse,
    } as unknown as ReturnType<typeof apiHooks.useUsers>)
    mockedUseCreateDelegation.mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useCreateDelegation>)
    mockedUseRevokeDelegation.mockReturnValue({
      mutateAsync: mockRevokeDelegationMutateAsync,
    } as unknown as ReturnType<typeof apiHooks.useRevokeDelegation>)

    renderWithQueryClient(<DelegationSection user={mockUser} />)

    const revokeButton = screen.getByRole("button", { name: "" })
    await user.click(revokeButton)

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "destructive",
          title: "Failed to revoke delegation",
        })
      )
    })
  })

  it("disables revoke button while revoking", async () => {
    const user = userEvent.setup()
    let resolveRevoke: (value: unknown) => void
    const revokePromise = new Promise((resolve) => {
      resolveRevoke = resolve
    })
    mockRevokeDelegationMutateAsync.mockReturnValue(revokePromise)

    mockedUseDelegations.mockReturnValue({
      data: { items: [mockDelegation], total: 1 },
    } as unknown as ReturnType<typeof apiHooks.useDelegations>)
    mockedUseUsers.mockReturnValue({
      data: mockUsersResponse,
    } as unknown as ReturnType<typeof apiHooks.useUsers>)
    mockedUseCreateDelegation.mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useCreateDelegation>)
    mockedUseRevokeDelegation.mockReturnValue({
      mutateAsync: mockRevokeDelegationMutateAsync,
    } as unknown as ReturnType<typeof apiHooks.useRevokeDelegation>)

    renderWithQueryClient(<DelegationSection user={mockUser} />)

    const revokeButtons = screen.getAllByRole("button")
    const revokeButton = revokeButtons.find((btn) => btn.querySelector("svg"))

    await user.click(revokeButton!)

    expect(revokeButton).toBeDisabled()

    resolveRevoke!({ status: "revoked" })
  })

  it("closes dialog after successful creation", async () => {
    const user = userEvent.setup()
    mockCreateDelegationMutateAsync.mockResolvedValue(mockDelegation)

    mockedUseDelegations.mockReturnValue({
      data: { items: [], total: 0 },
    } as unknown as ReturnType<typeof apiHooks.useDelegations>)
    mockedUseUsers.mockReturnValue({
      data: mockUsersResponse,
    } as unknown as ReturnType<typeof apiHooks.useUsers>)
    mockedUseCreateDelegation.mockReturnValue({
      mutateAsync: mockCreateDelegationMutateAsync,
    } as unknown as ReturnType<typeof apiHooks.useCreateDelegation>)
    mockedUseRevokeDelegation.mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useRevokeDelegation>)

    renderWithQueryClient(<DelegationSection user={mockUser} />)

    const addButton = screen.getByRole("button", { name: /add delegate/i })
    await user.click(addButton)

    expect(screen.getByText("Create Delegation")).toBeInTheDocument()

    const selectTrigger = screen.getByPlaceholderText("Select a user")
    await user.click(selectTrigger)
    await user.click(screen.getByText("Test User 2"))

    const scopeTrigger = screen.getByPlaceholderText("Select scope")
    await user.click(scopeTrigger)
    await user.click(screen.getByText("Full Access"))

    const submitButton = screen.getByRole("button", {
      name: /create delegation/i,
    })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.queryByText("Create Delegation")).not.toBeInTheDocument()
    })
  })

  it("closes dialog when Cancel is clicked", async () => {
    const user = userEvent.setup()

    mockedUseDelegations.mockReturnValue({
      data: { items: [], total: 0 },
    } as unknown as ReturnType<typeof apiHooks.useDelegations>)
    mockedUseUsers.mockReturnValue({
      data: mockUsersResponse,
    } as unknown as ReturnType<typeof apiHooks.useUsers>)
    mockedUseCreateDelegation.mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useCreateDelegation>)
    mockedUseRevokeDelegation.mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useRevokeDelegation>)

    renderWithQueryClient(<DelegationSection user={mockUser} />)

    const addButton = screen.getByRole("button", { name: /add delegate/i })
    await user.click(addButton)

    expect(screen.getByText("Create Delegation")).toBeInTheDocument()

    const cancelButton = screen.getByRole("button", { name: /cancel/i })
    await user.click(cancelButton)

    await waitFor(() => {
      expect(screen.queryByText("Create Delegation")).not.toBeInTheDocument()
    })
  })
})

describe("formatExpiresAt", () => {
  it("handles past expiration dates", () => {
    const expiredDelegation = {
      ...mockDelegation,
      expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    }

    mockedUseDelegations.mockReturnValue({
      data: { items: [expiredDelegation], total: 1 },
    } as unknown as ReturnType<typeof apiHooks.useDelegations>)
    mockedUseUsers.mockReturnValue({
      data: mockUsersResponse,
    } as unknown as ReturnType<typeof apiHooks.useUsers>)
    mockedUseCreateDelegation.mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useCreateDelegation>)
    mockedUseRevokeDelegation.mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useRevokeDelegation>)

    renderWithQueryClient(<DelegationSection user={mockUser} />)

    expect(screen.getByText("Expired")).toBeInTheDocument()
  })

  it("handles expiration today", () => {
    const todayDelegation = {
      ...mockDelegation,
      expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    }

    mockedUseDelegations.mockReturnValue({
      data: { items: [todayDelegation], total: 1 },
    } as unknown as ReturnType<typeof apiHooks.useDelegations>)
    mockedUseUsers.mockReturnValue({
      data: mockUsersResponse,
    } as unknown as ReturnType<typeof apiHooks.useUsers>)
    mockedUseCreateDelegation.mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useCreateDelegation>)
    mockedUseRevokeDelegation.mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useRevokeDelegation>)

    renderWithQueryClient(<DelegationSection user={mockUser} />)

    expect(screen.getByText("Expires today")).toBeInTheDocument()
  })

  it("handles expiration tomorrow", () => {
    const tomorrowDelegation = {
      ...mockDelegation,
      expires_at: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
    }

    mockedUseDelegations.mockReturnValue({
      data: { items: [tomorrowDelegation], total: 1 },
    } as unknown as ReturnType<typeof apiHooks.useDelegations>)
    mockedUseUsers.mockReturnValue({
      data: mockUsersResponse,
    } as unknown as ReturnType<typeof apiHooks.useUsers>)
    mockedUseCreateDelegation.mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useCreateDelegation>)
    mockedUseRevokeDelegation.mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useRevokeDelegation>)

    renderWithQueryClient(<DelegationSection user={mockUser} />)

    expect(screen.getByText("Expires tomorrow")).toBeInTheDocument()
  })

  it("handles expiration within a week", () => {
    const weekDelegation = {
      ...mockDelegation,
      expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    }

    mockedUseDelegations.mockReturnValue({
      data: { items: [weekDelegation], total: 1 },
    } as unknown as ReturnType<typeof apiHooks.useDelegations>)
    mockedUseUsers.mockReturnValue({
      data: mockUsersResponse,
    } as unknown as ReturnType<typeof apiHooks.useUsers>)
    mockedUseCreateDelegation.mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useCreateDelegation>)
    mockedUseRevokeDelegation.mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useRevokeDelegation>)

    renderWithQueryClient(<DelegationSection user={mockUser} />)

    expect(screen.getByText(/expires in 3 days/i)).toBeInTheDocument()
  })

  it("displays formatted date for expiration beyond a week", () => {
    const farFutureDelegation = {
      ...mockDelegation,
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    }

    mockedUseDelegations.mockReturnValue({
      data: { items: [farFutureDelegation], total: 1 },
    } as unknown as ReturnType<typeof apiHooks.useDelegations>)
    mockedUseUsers.mockReturnValue({
      data: mockUsersResponse,
    } as unknown as ReturnType<typeof apiHooks.useUsers>)
    mockedUseCreateDelegation.mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useCreateDelegation>)
    mockedUseRevokeDelegation.mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useRevokeDelegation>)

    renderWithQueryClient(<DelegationSection user={mockUser} />)

    expect(screen.getByText(/\//)).toBeInTheDocument()
  })
})
