import {
  mockApiError as _mockApiError,
  mockApiResponse as _mockApiResponse,
  createWrapper,
  mockAgent,
  mockUser,
  mockUsersResponse,
} from "@/test/utils"
import { QueryClient } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import api from "@/lib/api/client"
import * as hooks from "@/lib/api/hooks"

vi.mock("@/lib/api/client", () => ({
  default: {
    getMe: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    getEnterprises: vi.fn(),
    getEnterprise: vi.fn(),
    createEnterprise: vi.fn(),
    updateEnterprise: vi.fn(),
    getDepartments: vi.fn(),
    getDepartment: vi.fn(),
    createDepartment: vi.fn(),
    updateDepartment: vi.fn(),
    deleteDepartment: vi.fn(),
    getDepartmentHumanLoopConfig: vi.fn(),
    updateDepartmentHumanLoopConfig: vi.fn(),
    getAgents: vi.fn(),
    getAgent: vi.fn(),
    createAgent: vi.fn(),
    updateAgent: vi.fn(),
    deleteAgent: vi.fn(),
    getAgentSoul: vi.fn(),
    syncAgentSoul: vi.fn(),
    updateAgentSoul: vi.fn(),
    getAgentHumanLoopConfig: vi.fn(),
    updateAgentHumanLoopConfig: vi.fn(),
    getApprovals: vi.fn(),
    getApproval: vi.fn(),
    getApprovalStats: vi.fn(),
    approveApproval: vi.fn(),
    rejectApproval: vi.fn(),
    getTasks: vi.fn(),
    getTask: vi.fn(),
    createTask: vi.fn(),
    getTaskStats: vi.fn(),
    getUsers: vi.fn(),
    getUser: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    getCollections: vi.fn(),
    searchKnowledge: vi.fn(),
    ingestDocument: vi.fn(),
    getSessions: vi.fn(),
    createSession: vi.fn(),
    patchSession: vi.fn(),
    resetSession: vi.fn(),
    deleteSession: vi.fn(),
    getSessionUsage: vi.fn(),
    getChatHistory: vi.fn(),
    sendChatMessage: vi.fn(),
    abortChat: vi.fn(),
    getConversations: vi.fn(),
    startConversation: vi.fn(),
    getAvailableAgentsForChat: vi.fn(),
    getGatewayConfig: vi.fn(),
    getGatewayConfigSchema: vi.fn(),
    getGatewayConfigKeys: vi.fn(),
    getGatewayConfigPresets: vi.fn(),
    patchGatewayConfig: vi.fn(),
    applyGatewayConfigPreset: vi.fn(),
    getCronJobs: vi.fn(),
    createCronJob: vi.fn(),
    updateCronJob: vi.fn(),
    deleteCronJob: vi.fn(),
    runCronJob: vi.fn(),
    toggleCronJob: vi.fn(),
    getCronTemplates: vi.fn(),
    getChannelsStatus: vi.fn(),
    getAvailableChannels: vi.fn(),
    sendChannelMessage: vi.fn(),
    connectChannel: vi.fn(),
    disconnectChannel: vi.fn(),
    getChannelQR: vi.fn(),
    getRoutingRules: vi.fn(),
    updateRoutingRules: vi.fn(),
    getChannelInstances: vi.fn(),
    getChannelInstance: vi.fn(),
    updateChannelInstance: vi.fn(),
    reconnectChannelInstance: vi.fn(),
    deleteChannelInstance: vi.fn(),
    getQueuedMessages: vi.fn(),
    getDelegations: vi.fn(),
    getDelegation: vi.fn(),
    createDelegation: vi.fn(),
    revokeDelegation: vi.fn(),
    linkAgentToUser: vi.fn(),
    unlinkAgentFromUser: vi.fn(),
    getAgentsByUser: vi.fn(),
  },
}))

const mockedApi = vi.mocked(api)

describe("Auth Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("useMe", () => {
    it("returns user data when authenticated", async () => {
      const mockMeUser = { id: "1", email: "test@example.com", name: "Test", enterprise_id: "enterprise-1" }
      mockedApi.getMe.mockResolvedValue(mockMeUser)

      const { result } = renderHook(() => hooks.useMe(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockMeUser)
      expect(mockedApi.getMe).toHaveBeenCalledTimes(1)
    })

    it("handles authentication error gracefully", async () => {
      mockedApi.getMe.mockRejectedValue(new Error("Unauthorized"))

      const { result } = renderHook(() => hooks.useMe(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeInstanceOf(Error)
    })

    it("does not retry on failure", async () => {
      mockedApi.getMe.mockRejectedValue(new Error("Unauthorized"))

      const { result } = renderHook(() => hooks.useMe(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(mockedApi.getMe).toHaveBeenCalledTimes(1)
    })
  })

  describe("useLogin", () => {
    it("calls login API and invalidates me query", async () => {
      mockedApi.login.mockResolvedValue({ access_token: "test-token", refresh_token: "refresh-token", user: { id: "1", email: "test@example.com", name: "Test", enterprise_id: "enterprise-1" } })

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")

      const { result } = renderHook(() => hooks.useLogin(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate({ email: "test@example.com", password: "password" })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(mockedApi.login).toHaveBeenCalledWith(
        "test@example.com",
        "password"
      )
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: hooks.queryKeys.me,
      })
    })

    it("handles login error", async () => {
      mockedApi.login.mockRejectedValue(new Error("Invalid credentials"))

      const { result } = renderHook(() => hooks.useLogin(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({ email: "test@example.com", password: "wrong" })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeInstanceOf(Error)
    })
  })

  describe("useLogout", () => {
    it("calls logout API and clears query cache", async () => {
      mockedApi.logout.mockResolvedValue(undefined)

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })
      const clearSpy = vi.spyOn(queryClient, "clear")

      const { result } = renderHook(() => hooks.useLogout(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate()

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(mockedApi.logout).toHaveBeenCalledTimes(1)
      expect(clearSpy).toHaveBeenCalledTimes(1)
    })
  })
})

describe("Users Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("useUsers", () => {
    it("fetches users with enterprise filter", async () => {
      mockedApi.getUsers.mockResolvedValue(mockUsersResponse as never)

      const { result } = renderHook(
        () => hooks.useUsers({ enterprise_id: "enterprise-1" }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockUsersResponse)
      expect(mockedApi.getUsers).toHaveBeenCalledWith({
        enterprise_id: "enterprise-1",
      })
    })

    it("handles empty enterprise_id parameter", async () => {
      mockedApi.getUsers.mockResolvedValue(mockUsersResponse as never)

      const { result } = renderHook(() => hooks.useUsers(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(mockedApi.getUsers).toHaveBeenCalledWith(undefined)
    })

    it("handles API error", async () => {
      mockedApi.getUsers.mockRejectedValue(new Error("Network error"))

      const { result } = renderHook(() => hooks.useUsers(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeInstanceOf(Error)
    })
  })

  describe("useUser", () => {
    it("fetches single user by id", async () => {
      mockedApi.getUser.mockResolvedValue(mockUser)

      const { result } = renderHook(() => hooks.useUser("user-1"), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockUser)
      expect(mockedApi.getUser).toHaveBeenCalledWith("user-1")
    })

    it("does not fetch when id is empty", async () => {
      const { result } = renderHook(() => hooks.useUser(""), {
        wrapper: createWrapper(),
      })

      expect(result.current.isFetching).toBe(false)
      expect(mockedApi.getUser).not.toHaveBeenCalled()
    })

    it("handles null/undefined id gracefully", async () => {
      const { result } = renderHook(
        () => hooks.useUser(null as unknown as string),
        {
          wrapper: createWrapper(),
        }
      )

      expect(result.current.isFetching).toBe(false)
    })
  })

  describe("useCreateUser", () => {
    it("creates user and invalidates users list", async () => {
      mockedApi.createUser.mockResolvedValue(mockUser)

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")

      const { result } = renderHook(() => hooks.useCreateUser(), {
        wrapper: createWrapper(queryClient),
      })

      const userData = {
        enterprise_id: "enterprise-1",
        email: "new@example.com",
        name: "New User",
      }

      result.current.mutate(userData)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(mockedApi.createUser).toHaveBeenCalledWith(userData)
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["users"] })
    })

    it("handles creation error with proper error message", async () => {
      mockedApi.createUser.mockRejectedValue(new Error("Email already exists"))

      const { result } = renderHook(() => hooks.useCreateUser(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        enterprise_id: "enterprise-1",
        email: "existing@example.com",
        name: "Existing User",
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error?.message).toBe("Email already exists")
    })
  })

  describe("useUpdateUser", () => {
    it("updates user and invalidates both single and list queries", async () => {
      const updatedUser = { ...mockUser, name: "Updated Name" }
      mockedApi.updateUser.mockResolvedValue(updatedUser)

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")

      const { result } = renderHook(() => hooks.useUpdateUser(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate({ id: "user-1", data: { name: "Updated Name" } })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(mockedApi.updateUser).toHaveBeenCalledWith("user-1", {
        name: "Updated Name",
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: hooks.queryKeys.user("user-1"),
      })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["users"] })
    })
  })

  describe("useDeleteUser", () => {
    it("deletes user and invalidates users list", async () => {
      mockedApi.deleteUser.mockResolvedValue(undefined)

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")

      const { result } = renderHook(() => hooks.useDeleteUser(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate("user-1")

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(mockedApi.deleteUser).toHaveBeenCalledWith("user-1")
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["users"] })
    })
  })
})

describe("Delegation Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockDelegationsResponse = {
    items: [
      {
        id: "delegation-1",
        delegator_id: "user-1",
        delegator_name: "Test User",
        delegate_id: "user-2",
        delegate_name: "Delegate User",
        scope: "approvals" as const,
        status: "active" as const,
        expires_at: "2024-12-31T23:59:59Z",
        created_at: "2024-01-01T00:00:00Z",
      },
    ],
    total: 1,
  }

  describe("useDelegations", () => {
    it("fetches delegations with user filter", async () => {
      mockedApi.getDelegations.mockResolvedValue(mockDelegationsResponse as never)

      const { result } = renderHook(
        () => hooks.useDelegations({ user_id: "user-1", as_delegator: true }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockDelegationsResponse)
      expect(mockedApi.getDelegations).toHaveBeenCalledWith({
        user_id: "user-1",
        as_delegator: true,
      })
    })

    it("does not fetch when user_id is missing", async () => {
      const { result } = renderHook(() => hooks.useDelegations({}), {
        wrapper: createWrapper(),
      })

      expect(result.current.isFetching).toBe(false)
      expect(mockedApi.getDelegations).not.toHaveBeenCalled()
    })
  })

  describe("useCreateDelegation", () => {
    it("creates delegation and invalidates delegations list", async () => {
      mockedApi.createDelegation.mockResolvedValue(
        mockDelegationsResponse.items[0] as never
      )

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")

      const { result } = renderHook(() => hooks.useCreateDelegation(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate({
        from_agent_id: "agent-1",
        to_agent_id: "agent-2",
        delegate_id: "user-2",
        task_types: ["approvals"],
        conditions: {},
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(mockedApi.createDelegation).toHaveBeenCalledWith({
        from_agent_id: "agent-1",
        to_agent_id: "agent-2",
        delegate_id: "user-2",
        task_types: ["approvals"],
        conditions: {},
      })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["delegations"] })
    })
  })

  describe("useRevokeDelegation", () => {
    it("revokes delegation and invalidates list", async () => {
      mockedApi.revokeDelegation.mockResolvedValue(undefined as never)

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")

      const { result } = renderHook(() => hooks.useRevokeDelegation(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate("delegation-1")

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(mockedApi.revokeDelegation).toHaveBeenCalledWith("delegation-1")
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["delegations"] })
    })
  })
})

describe("Channels Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockChannelsStatusResponse = {
    channels: [
      { id: "whatsapp", name: "WhatsApp", connected: true },
      { id: "telegram", name: "Telegram", connected: false },
    ],
    total_connected: 1,
    total_messages_today: 50,
  }

  describe("useChannelsStatus", () => {
    it("fetches channels status with auto-refresh", async () => {
      mockedApi.getChannelsStatus.mockResolvedValue(mockChannelsStatusResponse as never)

      const { result } = renderHook(() => hooks.useChannelsStatus(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockChannelsStatusResponse)
      expect(mockedApi.getChannelsStatus).toHaveBeenCalledTimes(1)
    })

    it("handles API error gracefully", async () => {
      mockedApi.getChannelsStatus.mockRejectedValue(
        new Error("OpenClaw unavailable")
      )

      const { result } = renderHook(() => hooks.useChannelsStatus(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeInstanceOf(Error)
    })
  })

  describe("useAvailableChannels", () => {
    it("fetches available channels list", async () => {
      const mockAvailableChannels = {
        channels: [
          { id: "whatsapp", name: "WhatsApp", auth_type: "qr_code" },
          { id: "telegram", name: "Telegram", auth_type: "bot_token" },
        ],
      }
      mockedApi.getAvailableChannels.mockResolvedValue(mockAvailableChannels as never)

      const { result } = renderHook(() => hooks.useAvailableChannels(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockAvailableChannels)
    })
  })

  describe("useConnectChannel", () => {
    it("connects channel and invalidates channels queries", async () => {
      mockedApi.connectChannel.mockResolvedValue(undefined as never)

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")

      const { result } = renderHook(() => hooks.useConnectChannel(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate({
        channel: "telegram",
        config: { bot_token: "test-token" },
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(mockedApi.connectChannel).toHaveBeenCalledWith("telegram", {
        bot_token: "test-token",
      })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["channels"] })
    })

    it("handles connection error", async () => {
      mockedApi.connectChannel.mockRejectedValue(new Error("Invalid bot token"))

      const { result } = renderHook(() => hooks.useConnectChannel(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        channel: "telegram",
        config: { bot_token: "invalid" },
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error?.message).toBe("Invalid bot token")
    })
  })

  describe("useDisconnectChannel", () => {
    it("disconnects channel and invalidates channels queries", async () => {
      mockedApi.disconnectChannel.mockResolvedValue(undefined as never)

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")

      const { result } = renderHook(() => hooks.useDisconnectChannel(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate("whatsapp")

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(mockedApi.disconnectChannel).toHaveBeenCalledWith("whatsapp")
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["channels"] })
    })
  })

  describe("useChannelQR", () => {
    it("fetches QR code for channel", async () => {
      const mockQRResponse = {
        qr_code: "data:image/png;base64,test",
        status: "pending",
        qr_data: "data:image/png;base64,test",
        expires_in: 60,
      }
      mockedApi.getChannelQR.mockResolvedValue(mockQRResponse)

      const { result } = renderHook(() => hooks.useChannelQR("whatsapp"), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockQRResponse)
    })

    it("does not fetch when channelId is empty", async () => {
      const { result } = renderHook(() => hooks.useChannelQR(""), {
        wrapper: createWrapper(),
      })

      expect(result.current.isFetching).toBe(false)
      expect(mockedApi.getChannelQR).not.toHaveBeenCalled()
    })
  })

  describe("useRoutingRules", () => {
    it("fetches routing rules", async () => {
      const mockRules = {
        rules: [
          {
            id: "rule-1",
            channel: "whatsapp",
            pattern: ".*",
            keywords: null,
            agent_id: "agent-1",
            department_id: null,
            priority: 0,
          },
        ],
      }
      mockedApi.getRoutingRules.mockResolvedValue(mockRules)

      const { result } = renderHook(() => hooks.useRoutingRules(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockRules)
    })
  })

  describe("useUpdateRoutingRules", () => {
    it("updates routing rules and invalidates query", async () => {
      const mockRules = [
        {
          id: "rule-1",
          channel: "whatsapp",
          pattern: ".*",
          keywords: null,
          agent_id: "agent-1",
          department_id: null,
          priority: 0,
        },
      ]
      mockedApi.updateRoutingRules.mockResolvedValue(undefined as never)

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")

      const { result } = renderHook(() => hooks.useUpdateRoutingRules(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate(mockRules)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(mockedApi.updateRoutingRules).toHaveBeenCalledWith(mockRules)
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["channels", "routing"],
      })
    })
  })

  describe("useChannelInstances", () => {
    it("fetches channel instances list", async () => {
      const mockInstances = {
        instances: [
          {
            id: "instance-1",
            platform: "whatsapp",
            name: "WhatsApp Business",
            account: "+1234567890",
            status: "connected" as const,
            enabled: true,
            config: {},
            last_activity: "2024-01-01T00:00:00Z",
            message_count: 100,
            error_message: null,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
        ],
        total: 1,
      }
      mockedApi.getChannelInstances.mockResolvedValue(mockInstances as never)

      const { result } = renderHook(
        () => hooks.useChannelInstances({ platform: "whatsapp" }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockInstances)
      expect(mockedApi.getChannelInstances).toHaveBeenCalledWith({
        platform: "whatsapp",
      })
    })

    it("handles API error gracefully", async () => {
      mockedApi.getChannelInstances.mockRejectedValue(
        new Error("Failed to fetch instances")
      )

      const { result } = renderHook(() => hooks.useChannelInstances(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeInstanceOf(Error)
    })
  })

  describe("useChannelInstance", () => {
    it("fetches single channel instance by id", async () => {
      const mockInstance = {
        id: "instance-1",
        platform: "whatsapp",
        name: "WhatsApp Business",
        account: "+1234567890",
        status: "connected" as const,
        enabled: true,
        config: {},
        last_activity: "2024-01-01T00:00:00Z",
        message_count: 100,
        error_message: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      }
      mockedApi.getChannelInstance.mockResolvedValue(mockInstance as never)

      const { result } = renderHook(
        () => hooks.useChannelInstance("instance-1"),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockInstance)
      expect(mockedApi.getChannelInstance).toHaveBeenCalledWith("instance-1")
    })

    it("does not fetch when instanceId is empty", async () => {
      const { result } = renderHook(() => hooks.useChannelInstance(""), {
        wrapper: createWrapper(),
      })

      expect(result.current.isFetching).toBe(false)
      expect(mockedApi.getChannelInstance).not.toHaveBeenCalled()
    })
  })

  describe("useUpdateChannelInstance", () => {
    it("updates channel instance and invalidates queries", async () => {
      mockedApi.updateChannelInstance.mockResolvedValue(undefined as never)

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")

      const { result } = renderHook(() => hooks.useUpdateChannelInstance(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate({
        instanceId: "instance-1",
        data: { name: "Updated Name", enabled: true },
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(mockedApi.updateChannelInstance).toHaveBeenCalledWith(
        "instance-1",
        { name: "Updated Name", enabled: true }
      )
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: hooks.queryKeys.channelInstance("instance-1"),
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["channels", "instances"],
      })
    })
  })

  describe("useReconnectChannelInstance", () => {
    it("reconnects channel instance and invalidates queries", async () => {
      mockedApi.reconnectChannelInstance.mockResolvedValue(undefined as never)

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")

      const { result } = renderHook(() => hooks.useReconnectChannelInstance(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate("instance-1")

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(mockedApi.reconnectChannelInstance).toHaveBeenCalledWith(
        "instance-1"
      )
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: hooks.queryKeys.channelInstance("instance-1"),
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["channels", "instances"],
      })
    })
  })

  describe("useDeleteChannelInstance", () => {
    it("deletes channel instance and invalidates queries", async () => {
      mockedApi.deleteChannelInstance.mockResolvedValue(undefined as never)

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")

      const { result } = renderHook(() => hooks.useDeleteChannelInstance(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate("instance-1")

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(mockedApi.deleteChannelInstance).toHaveBeenCalledWith("instance-1")
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["channels", "instances"],
      })
    })
  })
})

describe("Human Loop Config Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockHumanLoopConfig = {
    autonomy_level: "supervised" as const,
    auto_approve_up_to: 1000,
    actions_requiring_approval: ["send_email", "make_payment"],
    low_confidence_threshold: 0.7,
  } as never

  describe("useDepartmentHumanLoopConfig", () => {
    it("fetches department human loop config", async () => {
      mockedApi.getDepartmentHumanLoopConfig.mockResolvedValue(
        mockHumanLoopConfig
      )

      const { result } = renderHook(
        () => hooks.useDepartmentHumanLoopConfig("department-1"),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockHumanLoopConfig)
      expect(mockedApi.getDepartmentHumanLoopConfig).toHaveBeenCalledWith(
        "department-1"
      )
    })

    it("does not fetch when departmentId is empty", async () => {
      const { result } = renderHook(
        () => hooks.useDepartmentHumanLoopConfig(""),
        {
          wrapper: createWrapper(),
        }
      )

      expect(result.current.isFetching).toBe(false)
      expect(mockedApi.getDepartmentHumanLoopConfig).not.toHaveBeenCalled()
    })
  })

  describe("useUpdateDepartmentHumanLoopConfig", () => {
    it("updates config and invalidates query", async () => {
      mockedApi.updateDepartmentHumanLoopConfig.mockResolvedValue(
        mockHumanLoopConfig
      )

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")

      const { result } = renderHook(
        () => hooks.useUpdateDepartmentHumanLoopConfig(),
        {
          wrapper: createWrapper(queryClient),
        }
      )

      result.current.mutate({
        departmentId: "department-1",
        data: { autonomy_level: "full" },
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(mockedApi.updateDepartmentHumanLoopConfig).toHaveBeenCalledWith(
        "department-1",
        { autonomy_level: "full" }
      )
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: hooks.queryKeys.departmentHumanLoopConfig("department-1"),
      })
    })
  })

  describe("useAgentHumanLoopConfig", () => {
    it("fetches agent human loop config", async () => {
      mockedApi.getAgentHumanLoopConfig.mockResolvedValue(mockHumanLoopConfig)

      const { result } = renderHook(
        () => hooks.useAgentHumanLoopConfig("agent-1"),
        {
          wrapper: createWrapper(),
        }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockHumanLoopConfig)
    })

    it("does not fetch when agentId is empty", async () => {
      const { result } = renderHook(() => hooks.useAgentHumanLoopConfig(""), {
        wrapper: createWrapper(),
      })

      expect(result.current.isFetching).toBe(false)
    })
  })

  describe("useUpdateAgentHumanLoopConfig", () => {
    it("updates agent config and invalidates query", async () => {
      mockedApi.updateAgentHumanLoopConfig.mockResolvedValue(
        mockHumanLoopConfig
      )

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")

      const { result } = renderHook(
        () => hooks.useUpdateAgentHumanLoopConfig(),
        {
          wrapper: createWrapper(queryClient),
        }
      )

      result.current.mutate({
        agentId: "agent-1",
        data: { autonomy_level: "manual" },
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(mockedApi.updateAgentHumanLoopConfig).toHaveBeenCalledWith(
        "agent-1",
        { autonomy_level: "manual" }
      )
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: hooks.queryKeys.agentHumanLoopConfig("agent-1"),
      })
    })
  })

  describe("useLinkAgentToUser", () => {
    it("links agent to user and invalidates queries", async () => {
      const mockLinkedAgent = { ...mockAgent, user_id: "user-1" }
      mockedApi.linkAgentToUser.mockResolvedValue(mockLinkedAgent)

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")

      const { result } = renderHook(() => hooks.useLinkAgentToUser(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate({ agentId: "agent-1", userId: "user-1" })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(mockedApi.linkAgentToUser).toHaveBeenCalledWith(
        "agent-1",
        "user-1"
      )
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: hooks.queryKeys.agent("agent-1"),
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["agents"],
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: hooks.queryKeys.agentsByUser("user-1"),
      })
    })
  })

  describe("useUnlinkAgentFromUser", () => {
    it("unlinks agent from user and invalidates queries", async () => {
      const mockUnlinkedAgent = { ...mockAgent, user_id: null }
      mockedApi.unlinkAgentFromUser.mockResolvedValue(mockUnlinkedAgent)

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")

      const { result } = renderHook(() => hooks.useUnlinkAgentFromUser(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate({ agentId: "agent-1", userId: "user-1" })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(mockedApi.unlinkAgentFromUser).toHaveBeenCalledWith("agent-1")
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: hooks.queryKeys.agent("agent-1"),
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["agents"],
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: hooks.queryKeys.agentsByUser("user-1"),
      })
    })

    it("unlinks agent without userId parameter", async () => {
      const mockUnlinkedAgent = { ...mockAgent, user_id: null }
      mockedApi.unlinkAgentFromUser.mockResolvedValue(mockUnlinkedAgent)

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")

      const { result } = renderHook(() => hooks.useUnlinkAgentFromUser(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate({ agentId: "agent-1" })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(mockedApi.unlinkAgentFromUser).toHaveBeenCalledWith("agent-1")
      expect(invalidateSpy).not.toHaveBeenCalledWith({
        queryKey: expect.arrayContaining(["by-user"]),
      })
    })
  })

  describe("useAgentsByUser", () => {
    it("fetches agents linked to user", async () => {
      const mockAgents = [mockAgent]
      mockedApi.getAgentsByUser.mockResolvedValue(mockAgents)

      const { result } = renderHook(() => hooks.useAgentsByUser("user-1"), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockAgents)
      expect(mockedApi.getAgentsByUser).toHaveBeenCalledWith("user-1")
    })

    it("does not fetch when userId is empty", async () => {
      const { result } = renderHook(() => hooks.useAgentsByUser(""), {
        wrapper: createWrapper(),
      })

      expect(result.current.isFetching).toBe(false)
      expect(mockedApi.getAgentsByUser).not.toHaveBeenCalled()
    })

    it("handles API error", async () => {
      mockedApi.getAgentsByUser.mockRejectedValue(new Error("Network error"))

      const { result } = renderHook(() => hooks.useAgentsByUser("user-1"), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeInstanceOf(Error)
    })
  })
})

describe("Query Keys", () => {
  it("generates consistent query keys for users", () => {
    const key1 = hooks.queryKeys.users({ enterprise_id: "ent-1" })
    const key2 = hooks.queryKeys.users({ enterprise_id: "ent-1" })
    expect(key1).toEqual(key2)
  })

  it("generates different keys for different params", () => {
    const key1 = hooks.queryKeys.users({ enterprise_id: "ent-1" })
    const key2 = hooks.queryKeys.users({ enterprise_id: "ent-2" })
    expect(key1).not.toEqual(key2)
  })

  it("generates user-specific keys", () => {
    const key = hooks.queryKeys.user("user-1")
    expect(key).toEqual(["users", "user-1"])
  })

  it("generates delegation keys with params", () => {
    const key = hooks.queryKeys.delegations({
      user_id: "user-1",
      status: "active",
    })
    expect(key).toEqual([
      "delegations",
      { user_id: "user-1", status: "active" },
    ])
  })

  it("generates channel status keys", () => {
    expect(hooks.queryKeys.channelsStatus).toEqual(["channels", "status"])
    expect(hooks.queryKeys.routingRules).toEqual(["channels", "routing"])
    expect(hooks.queryKeys.channelQR("whatsapp")).toEqual([
      "channels",
      "whatsapp",
      "qr",
    ])
  })

  it("generates channel instance keys", () => {
    expect(hooks.queryKeys.channelInstances()).toEqual([
      "channels",
      "instances",
      undefined,
    ])
    expect(hooks.queryKeys.channelInstances({ platform: "whatsapp" })).toEqual([
      "channels",
      "instances",
      { platform: "whatsapp" },
    ])
    expect(hooks.queryKeys.channelInstance("instance-1")).toEqual([
      "channels",
      "instances",
      "instance-1",
    ])
  })

  it("generates human loop config keys", () => {
    expect(hooks.queryKeys.departmentHumanLoopConfig("dept-1")).toEqual([
      "departments",
      "dept-1",
      "human-loop-config",
    ])
    expect(hooks.queryKeys.agentHumanLoopConfig("agent-1")).toEqual([
      "agents",
      "agent-1",
      "human-loop-config",
    ])
  })

  it("generates agents by user key", () => {
    expect(hooks.queryKeys.agentsByUser("user-1")).toEqual([
      "agents",
      "by-user",
      "user-1",
    ])
  })
})
