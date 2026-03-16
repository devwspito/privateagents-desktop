import {
  createTestQueryClient as _createTestQueryClient,
  mockDepartment2 as _mockDepartment2,
  mockDepartment as _mockDepartment,
  mockUser2 as _mockUser2,
  mockViewerUser as _mockViewerUser,
  mockDepartmentsResponse,
  mockUser,
  mockUsersResponse,
  renderWithQueryClient,
} from "@/test/utils"
import {
  fireEvent as _fireEvent,
  screen,
  waitFor,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import * as apiHooks from "@/lib/api"

import { UsersTable } from "../users-table"

vi.mock("@/lib/api", () => ({
  useUsers: vi.fn(),
  useDepartments: vi.fn(),
}))

vi.mock("@/components/users/user-detail-sheet", () => ({
  UserDetailSheet: vi.fn(
    ({
      user,
      open,
      onOpenChange,
      departmentName: _departmentName,
      departments: _departments,
      onUpdate: _onUpdate,
    }) => (
      <div
        data-testid="user-detail-sheet"
        data-open={open}
        data-user-id={user?.id}
      >
        {open && (
          <button data-testid="close-sheet" onClick={() => onOpenChange(false)}>
            Close
          </button>
        )}
      </div>
    )
  ),
}))

const mockedUseUsers = vi.mocked(apiHooks.useUsers)
const mockedUseDepartments = vi.mocked(apiHooks.useDepartments)

describe("UsersTable", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders loading state while fetching users", () => {
    mockedUseUsers.mockReturnValue({
      data: undefined,
      isLoading: true,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useUsers>)
    mockedUseDepartments.mockReturnValue({
      data: mockDepartmentsResponse,
    } as unknown as ReturnType<typeof apiHooks.useDepartments>)

    const { container } = renderWithQueryClient(<UsersTable />)

    expect(container.querySelector(".animate-spin")).toBeInTheDocument()
  })

  it("renders users table with data", async () => {
    mockedUseUsers.mockReturnValue({
      data: mockUsersResponse,
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useUsers>)
    mockedUseDepartments.mockReturnValue({
      data: mockDepartmentsResponse,
    } as unknown as ReturnType<typeof apiHooks.useDepartments>)

    renderWithQueryClient(<UsersTable />)

    expect(screen.getByText("Test User")).toBeInTheDocument()
    expect(screen.getByText("test@example.com")).toBeInTheDocument()
    expect(screen.getByText("Engineering Team")).toBeInTheDocument()
    expect(screen.getByText("admin")).toBeInTheDocument()
  })

  it("displays empty state when no users found", () => {
    mockedUseUsers.mockReturnValue({
      data: { items: [], total: 0, limit: 50, offset: 0, has_more: false },
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useUsers>)
    mockedUseDepartments.mockReturnValue({
      data: mockDepartmentsResponse,
    } as unknown as ReturnType<typeof apiHooks.useDepartments>)

    renderWithQueryClient(<UsersTable />)

    expect(screen.getByText("No users found")).toBeInTheDocument()
    expect(screen.getByTestId("users-icon")).toBeInTheDocument()
  })

  it("filters users by search text (name)", async () => {
    const user = userEvent.setup()
    mockedUseUsers.mockReturnValue({
      data: mockUsersResponse,
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useUsers>)
    mockedUseDepartments.mockReturnValue({
      data: mockDepartmentsResponse,
    } as unknown as ReturnType<typeof apiHooks.useDepartments>)

    renderWithQueryClient(<UsersTable />)

    expect(screen.getByText("Test User")).toBeInTheDocument()
    expect(screen.getByText("Test User 2")).toBeInTheDocument()

    const searchInput = screen.getByPlaceholderText(/search/i)
    await user.type(searchInput, "Test User 2")

    await waitFor(() => {
      expect(screen.getByText("Test User 2")).toBeInTheDocument()
      expect(screen.queryByText("Test User")).not.toBeInTheDocument()
    })
  })

  it("filters users by search text (email)", async () => {
    const user = userEvent.setup()
    mockedUseUsers.mockReturnValue({
      data: mockUsersResponse,
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useUsers>)
    mockedUseDepartments.mockReturnValue({
      data: mockDepartmentsResponse,
    } as unknown as ReturnType<typeof apiHooks.useDepartments>)

    renderWithQueryClient(<UsersTable />)

    const searchInput = screen.getByPlaceholderText(/search/i)
    await user.type(searchInput, "test2@example.com")

    await waitFor(() => {
      expect(screen.getByText("Test User 2")).toBeInTheDocument()
      expect(screen.queryByText("test@example.com")).not.toBeInTheDocument()
    })
  })

  it("handles search with special characters safely", async () => {
    const user = userEvent.setup()
    mockedUseUsers.mockReturnValue({
      data: mockUsersResponse,
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useUsers>)
    mockedUseDepartments.mockReturnValue({
      data: mockDepartmentsResponse,
    } as unknown as ReturnType<typeof apiHooks.useDepartments>)

    renderWithQueryClient(<UsersTable />)

    const searchInput = screen.getByPlaceholderText(/search/i)

    await user.type(searchInput, "<script>alert('xss')</script>")

    await waitFor(() => {
      expect(screen.getByText("No users found")).toBeInTheDocument()
    })
  })

  it("filters users by department", async () => {
    const user = userEvent.setup()
    mockedUseUsers.mockReturnValue({
      data: mockUsersResponse,
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useUsers>)
    mockedUseDepartments.mockReturnValue({
      data: mockDepartmentsResponse,
    } as unknown as ReturnType<typeof apiHooks.useDepartments>)

    renderWithQueryClient(<UsersTable />)

    const departmentSelect = screen.getByRole("combobox", {
      name: /department/i,
    })
    await user.click(departmentSelect)

    const engineeringOption = screen.getByRole("option", {
      name: /engineering/i,
    })
    await user.click(engineeringOption)

    await waitFor(() => {
      expect(screen.getByText("Test User")).toBeInTheDocument()
    })
  })

  it("filters users by role", async () => {
    const user = userEvent.setup()
    mockedUseUsers.mockReturnValue({
      data: mockUsersResponse,
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useUsers>)
    mockedUseDepartments.mockReturnValue({
      data: mockDepartmentsResponse,
    } as unknown as ReturnType<typeof apiHooks.useDepartments>)

    renderWithQueryClient(<UsersTable />)

    const roleSelect = screen.getByRole("combobox", { name: /role/i })
    await user.click(roleSelect)

    const userOption = screen.getByRole("option", { name: /user/i })
    await user.click(userOption)

    await waitFor(() => {
      expect(screen.getByText("Test User 2")).toBeInTheDocument()
      expect(screen.queryByText("Test User")).not.toBeInTheDocument()
    })
  })

  it("displays user count", () => {
    mockedUseUsers.mockReturnValue({
      data: mockUsersResponse,
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useUsers>)
    mockedUseDepartments.mockReturnValue({
      data: mockDepartmentsResponse,
    } as unknown as ReturnType<typeof apiHooks.useDepartments>)

    renderWithQueryClient(<UsersTable />)

    expect(screen.getByText(/showing 3 users/i)).toBeInTheDocument()
  })

  it("displays singular 'user' for single result", async () => {
    const user = userEvent.setup()
    mockedUseUsers.mockReturnValue({
      data: mockUsersResponse,
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useUsers>)
    mockedUseDepartments.mockReturnValue({
      data: mockDepartmentsResponse,
    } as unknown as ReturnType<typeof apiHooks.useDepartments>)

    renderWithQueryClient(<UsersTable />)

    const searchInput = screen.getByPlaceholderText(/search/i)
    await user.type(searchInput, "Viewer")

    await waitFor(() => {
      expect(screen.getByText(/showing 1 user/i)).toBeInTheDocument()
    })
  })

  it("opens user detail sheet when clicking on user row", async () => {
    const user = userEvent.setup()
    mockedUseUsers.mockReturnValue({
      data: mockUsersResponse,
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useUsers>)
    mockedUseDepartments.mockReturnValue({
      data: mockDepartmentsResponse,
    } as unknown as ReturnType<typeof apiHooks.useDepartments>)

    renderWithQueryClient(<UsersTable />)

    const userRow = screen.getByText("Test User").closest("tr")
    await user.click(userRow!)

    await waitFor(() => {
      const sheet = screen.getByTestId("user-detail-sheet")
      expect(sheet).toHaveAttribute("data-open", "true")
      expect(sheet).toHaveAttribute("data-user-id", "user-1")
    })
  })

  it("closes user detail sheet when onOpenChange is called with false", async () => {
    const user = userEvent.setup()
    mockedUseUsers.mockReturnValue({
      data: mockUsersResponse,
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useUsers>)
    mockedUseDepartments.mockReturnValue({
      data: mockDepartmentsResponse,
    } as unknown as ReturnType<typeof apiHooks.useDepartments>)

    renderWithQueryClient(<UsersTable />)

    const userRow = screen.getByText("Test User").closest("tr")
    await user.click(userRow!)

    await waitFor(() => {
      expect(screen.getByTestId("user-detail-sheet")).toHaveAttribute(
        "data-open",
        "true"
      )
    })

    const closeButton = screen.getByTestId("close-sheet")
    await user.click(closeButton)

    await waitFor(() => {
      expect(screen.getByTestId("user-detail-sheet")).toHaveAttribute(
        "data-open",
        "false"
      )
    })
  })

  it("calls refetch when refresh button is clicked", async () => {
    const user = userEvent.setup()
    const mockRefetch = vi.fn()
    mockedUseUsers.mockReturnValue({
      data: mockUsersResponse,
      isLoading: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof apiHooks.useUsers>)
    mockedUseDepartments.mockReturnValue({
      data: mockDepartmentsResponse,
    } as unknown as ReturnType<typeof apiHooks.useDepartments>)

    renderWithQueryClient(<UsersTable />)

    const refreshButton = screen.getByRole("button", { name: /refresh/i })
    await user.click(refreshButton)

    expect(mockRefetch).toHaveBeenCalledTimes(1)
  })

  it("displays department name for user with department", () => {
    mockedUseUsers.mockReturnValue({
      data: mockUsersResponse,
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useUsers>)
    mockedUseDepartments.mockReturnValue({
      data: mockDepartmentsResponse,
    } as unknown as ReturnType<typeof apiHooks.useDepartments>)

    renderWithQueryClient(<UsersTable />)

    const engineeringCells = screen.getAllByText("Engineering Team")
    expect(engineeringCells.length).toBeGreaterThan(0)
  })

  it("displays dash for user without department", () => {
    const userWithoutDept = {
      ...mockUser,
      id: "user-no-dept",
      department_id: null,
    }
    mockedUseUsers.mockReturnValue({
      data: {
        items: [userWithoutDept],
        total: 1,
        limit: 50,
        offset: 0,
        has_more: false,
      },
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useUsers>)
    mockedUseDepartments.mockReturnValue({
      data: mockDepartmentsResponse,
    } as unknown as ReturnType<typeof apiHooks.useDepartments>)

    renderWithQueryClient(<UsersTable />)

    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it("displays correct role badge colors", () => {
    mockedUseUsers.mockReturnValue({
      data: mockUsersResponse,
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useUsers>)
    mockedUseDepartments.mockReturnValue({
      data: mockDepartmentsResponse,
    } as unknown as ReturnType<typeof apiHooks.useDepartments>)

    renderWithQueryClient(<UsersTable />)

    const adminBadge = screen.getByText("admin")
    expect(adminBadge).toHaveClass("bg-purple-100")

    const userBadge = screen.getByText("user")
    expect(userBadge).toHaveClass("bg-gray-100")

    const viewerBadge = screen.getByText("viewer")
    expect(viewerBadge).toHaveClass("bg-slate-100")
  })

  it("displays user avatar with initials", () => {
    mockedUseUsers.mockReturnValue({
      data: mockUsersResponse,
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useUsers>)
    mockedUseDepartments.mockReturnValue({
      data: mockDepartmentsResponse,
    } as unknown as ReturnType<typeof apiHooks.useDepartments>)

    renderWithQueryClient(<UsersTable />)

    expect(screen.getByText("TU")).toBeInTheDocument()
  })

  it("displays 'Unknown' for user without name", () => {
    const userWithoutName = {
      ...mockUser,
      id: "user-no-name",
      name: null,
    }
    mockedUseUsers.mockReturnValue({
      data: {
        items: [userWithoutName],
        total: 1,
        limit: 50,
        offset: 0,
        has_more: false,
      },
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useUsers>)
    mockedUseDepartments.mockReturnValue({
      data: mockDepartmentsResponse,
    } as unknown as ReturnType<typeof apiHooks.useDepartments>)

    renderWithQueryClient(<UsersTable />)

    expect(screen.getByText("Unknown")).toBeInTheDocument()
  })

  it("handles case-insensitive search", async () => {
    const user = userEvent.setup()
    mockedUseUsers.mockReturnValue({
      data: mockUsersResponse,
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useUsers>)
    mockedUseDepartments.mockReturnValue({
      data: mockDepartmentsResponse,
    } as unknown as ReturnType<typeof apiHooks.useDepartments>)

    renderWithQueryClient(<UsersTable />)

    const searchInput = screen.getByPlaceholderText(/search/i)
    await user.type(searchInput, "TEST USER")

    await waitFor(() => {
      expect(screen.getByText("Test User")).toBeInTheDocument()
      expect(screen.getByText("Test User 2")).toBeInTheDocument()
    })
  })

  it("handles empty search string correctly", async () => {
    const user = userEvent.setup()
    mockedUseUsers.mockReturnValue({
      data: mockUsersResponse,
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useUsers>)
    mockedUseDepartments.mockReturnValue({
      data: mockDepartmentsResponse,
    } as unknown as ReturnType<typeof apiHooks.useDepartments>)

    renderWithQueryClient(<UsersTable />)

    const searchInput = screen.getByPlaceholderText(/search/i)
    await user.type(searchInput, "xyz")

    await waitFor(() => {
      expect(screen.getByText("No users found")).toBeInTheDocument()
    })

    await user.clear(searchInput)

    await waitFor(() => {
      expect(screen.getByText("Test User")).toBeInTheDocument()
      expect(screen.getByText("Test User 2")).toBeInTheDocument()
    })
  })
})

describe("UserRow", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders user information correctly", () => {
    mockedUseUsers.mockReturnValue({
      data: {
        items: [mockUser],
        total: 1,
        limit: 50,
        offset: 0,
        has_more: false,
      },
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useUsers>)
    mockedUseDepartments.mockReturnValue({
      data: mockDepartmentsResponse,
    } as unknown as ReturnType<typeof apiHooks.useDepartments>)

    renderWithQueryClient(<UsersTable />)

    expect(screen.getByText("Test User")).toBeInTheDocument()
    expect(screen.getByText("test@example.com")).toBeInTheDocument()
    expect(screen.getByText("Engineering Team")).toBeInTheDocument()
    expect(screen.getByText("admin")).toBeInTheDocument()
  })

  it("has cursor pointer style for clickable rows", () => {
    mockedUseUsers.mockReturnValue({
      data: {
        items: [mockUser],
        total: 1,
        limit: 50,
        offset: 0,
        has_more: false,
      },
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof apiHooks.useUsers>)
    mockedUseDepartments.mockReturnValue({
      data: mockDepartmentsResponse,
    } as unknown as ReturnType<typeof apiHooks.useDepartments>)

    renderWithQueryClient(<UsersTable />)

    const row = screen.getByText("Test User").closest("tr")
    expect(row).toHaveClass("cursor-pointer")
  })
})
