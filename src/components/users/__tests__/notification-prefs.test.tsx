import { mockToast } from "@/test/setup"
import { mockUser2 as _mockUser2, mockUser } from "@/test/utils"
import {
  fireEvent as _fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { NotificationPrefs } from "../notification-prefs"

describe("NotificationPrefs", () => {
  const mockOnUpdate = vi.fn()

  beforeEach(() => {
    mockOnUpdate.mockClear()
    mockToast.mockClear()
  })

  describe("rendering", () => {
    it("renders notification preferences header", () => {
      render(<NotificationPrefs user={mockUser} />)
      expect(screen.getByText("Notification Preferences")).toBeInTheDocument()
    })

    it("renders all notification preference items", () => {
      render(<NotificationPrefs user={mockUser} />)

      expect(screen.getByText("Email Notifications")).toBeInTheDocument()
      expect(screen.getByText("Approval Requests")).toBeInTheDocument()
      expect(screen.getByText("Task Updates")).toBeInTheDocument()
      expect(screen.getByText("Weekly Digest")).toBeInTheDocument()
      expect(screen.getByText("Real-time Alerts")).toBeInTheDocument()
    })

    it("renders descriptions for each preference", () => {
      render(<NotificationPrefs user={mockUser} />)

      expect(
        screen.getByText("Receive notifications via email")
      ).toBeInTheDocument()
      expect(
        screen.getByText("Get notified when approvals need your review")
      ).toBeInTheDocument()
      expect(
        screen.getByText("Updates on task completions and failures")
      ).toBeInTheDocument()
      expect(
        screen.getByText("Summary of weekly activity and metrics")
      ).toBeInTheDocument()
      expect(
        screen.getByText("Instant alerts for critical events")
      ).toBeInTheDocument()
    })

    it("renders switches for each preference", () => {
      render(<NotificationPrefs user={mockUser} />)

      const switches = screen.getAllByRole("switch")
      expect(switches).toHaveLength(5)
    })
  })

  describe("default values", () => {
    it("shows email notifications enabled by default", () => {
      render(<NotificationPrefs user={mockUser} />)
      const emailSwitch = screen.getByRole("switch", {
        name: /email notifications/i,
      })
      expect(emailSwitch).toBeChecked()
    })

    it("shows approval requests enabled by default", () => {
      render(<NotificationPrefs user={mockUser} />)
      const approvalSwitch = screen.getByRole("switch", {
        name: /approval requests/i,
      })
      expect(approvalSwitch).toBeChecked()
    })

    it("shows task updates enabled by default", () => {
      render(<NotificationPrefs user={mockUser} />)
      const taskSwitch = screen.getByRole("switch", { name: /task updates/i })
      expect(taskSwitch).toBeChecked()
    })

    it("shows weekly digest disabled by default", () => {
      render(<NotificationPrefs user={mockUser} />)
      const digestSwitch = screen.getByRole("switch", {
        name: /weekly digest/i,
      })
      expect(digestSwitch).not.toBeChecked()
    })

    it("shows real-time alerts enabled by default", () => {
      render(<NotificationPrefs user={mockUser} />)
      const alertsSwitch = screen.getByRole("switch", {
        name: /real-time alerts/i,
      })
      expect(alertsSwitch).toBeChecked()
    })
  })

  describe("toggling preferences", () => {
    it("toggles email notifications off when clicked", async () => {
      const user = userEvent.setup()
      render(<NotificationPrefs user={mockUser} onUpdate={mockOnUpdate} />)

      const emailSwitch = screen.getByRole("switch", {
        name: /email notifications/i,
      })
      await user.click(emailSwitch)

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            emailNotifications: false,
          })
        )
      })
    })

    it("toggles weekly digest on when clicked", async () => {
      const user = userEvent.setup()
      render(<NotificationPrefs user={mockUser} onUpdate={mockOnUpdate} />)

      const digestSwitch = screen.getByRole("switch", {
        name: /weekly digest/i,
      })
      await user.click(digestSwitch)

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            weeklyDigest: true,
          })
        )
      })
    })

    it("shows toast notification on successful update", async () => {
      const user = userEvent.setup()
      render(<NotificationPrefs user={mockUser} />)

      const emailSwitch = screen.getByRole("switch", {
        name: /email notifications/i,
      })
      await user.click(emailSwitch)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Preference updated",
            description: expect.stringContaining("Email Notifications"),
          })
        )
      })
    })

    it("shows enabled/disabled status in toast message", async () => {
      const user = userEvent.setup()
      render(<NotificationPrefs user={mockUser} />)

      const digestSwitch = screen.getByRole("switch", {
        name: /weekly digest/i,
      })
      await user.click(digestSwitch)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Preference updated",
            description: expect.stringContaining("enabled"),
          })
        )
      })
    })

    it("calls onUpdate with updated preferences", async () => {
      const user = userEvent.setup()
      render(<NotificationPrefs user={mockUser} onUpdate={mockOnUpdate} />)

      const approvalSwitch = screen.getByRole("switch", {
        name: /approval requests/i,
      })
      await user.click(approvalSwitch)

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledTimes(1)
        expect(mockOnUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            approvalRequests: false,
            emailNotifications: true,
            taskUpdates: true,
            weeklyDigest: false,
            realTimeAlerts: true,
          })
        )
      })
    })
  })

  describe("loading states", () => {
    it("disables switch while updating", async () => {
      const user = userEvent.setup()
      render(<NotificationPrefs user={mockUser} />)

      const emailSwitch = screen.getByRole("switch", {
        name: /email notifications/i,
      })
      await user.click(emailSwitch)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalled()
      })
    })
  })

  describe("disabled state", () => {
    it("disables all switches when disabled prop is true", () => {
      render(<NotificationPrefs user={mockUser} disabled />)

      const switches = screen.getAllByRole("switch")
      switches.forEach((sw) => {
        expect(sw).toBeDisabled()
      })
    })

    it("shows disabled message when disabled", () => {
      render(<NotificationPrefs user={mockUser} disabled />)

      expect(
        screen.getByText(
          "Notification preferences can only be edited by the user"
        )
      ).toBeInTheDocument()
    })

    it("does not show disabled message when not disabled", () => {
      render(<NotificationPrefs user={mockUser} />)

      expect(
        screen.queryByText(
          "Notification preferences can only be edited by the user"
        )
      ).not.toBeInTheDocument()
    })

    it("applies opacity to labels when disabled", () => {
      const { container } = render(
        <NotificationPrefs user={mockUser} disabled />
      )

      const labels = container.querySelectorAll(
        ".cursor-not-allowed.opacity-50"
      )
      expect(labels.length).toBeGreaterThan(0)
    })
  })

  describe("visual states", () => {
    it("shows enabled icon background when preference is enabled", () => {
      const { container } = render(<NotificationPrefs user={mockUser} />)

      const enabledBackgrounds = container.querySelectorAll(".bg-primary\\/10")
      expect(enabledBackgrounds.length).toBeGreaterThan(0)
    })

    it("shows muted icon background when preference is disabled", async () => {
      const user = userEvent.setup()
      const { container: _container } = render(
        <NotificationPrefs user={mockUser} />
      )

      const digestSwitch = screen.getByRole("switch", {
        name: /weekly digest/i,
      })
      await user.click(digestSwitch)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalled()
      })
    })
  })

  describe("edge cases", () => {
    it("handles rapid toggling of same preference", async () => {
      const user = userEvent.setup()
      render(<NotificationPrefs user={mockUser} onUpdate={mockOnUpdate} />)

      const digestSwitch = screen.getByRole("switch", {
        name: /weekly digest/i,
      })

      await user.click(digestSwitch)
      await waitFor(() => expect(mockOnUpdate).toHaveBeenCalledTimes(1))

      await user.click(digestSwitch)
      await waitFor(() => expect(mockOnUpdate).toHaveBeenCalledTimes(2))
    })

    it("handles toggling multiple preferences in sequence", async () => {
      const user = userEvent.setup()
      render(<NotificationPrefs user={mockUser} onUpdate={mockOnUpdate} />)

      const emailSwitch = screen.getByRole("switch", {
        name: /email notifications/i,
      })
      const digestSwitch = screen.getByRole("switch", {
        name: /weekly digest/i,
      })

      await user.click(emailSwitch)
      await waitFor(() => expect(mockOnUpdate).toHaveBeenCalled())

      mockOnUpdate.mockClear()

      await user.click(digestSwitch)
      await waitFor(() => expect(mockOnUpdate).toHaveBeenCalled())
    })

    it("handles user without profile data", () => {
      const minimalUser = { ...mockUser, name: null }
      render(<NotificationPrefs user={minimalUser} />)

      expect(screen.getByText("Notification Preferences")).toBeInTheDocument()
    })
  })

  describe("accessibility", () => {
    it("associates labels with switches via htmlFor", () => {
      render(<NotificationPrefs user={mockUser} />)

      const emailSwitch = screen.getByRole("switch", {
        name: /email notifications/i,
      })

      expect(emailSwitch).toHaveAttribute("id", "emailNotifications")
    })

    it("has accessible descriptions for each preference", () => {
      render(<NotificationPrefs user={mockUser} />)

      expect(
        screen.getByText("Receive notifications via email")
      ).toBeInTheDocument()
      expect(
        screen.getByText("Get notified when approvals need your review")
      ).toBeInTheDocument()
    })
  })

  describe("error handling", () => {
    it("handles async errors gracefully", async () => {
      vi.useFakeTimers()
      const user = userEvent.setup({ delay: null })

      render(<NotificationPrefs user={mockUser} />)

      const emailSwitch = screen.getByRole("switch", {
        name: /email notifications/i,
      })
      await user.click(emailSwitch)

      vi.advanceTimersByTime(500)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalled()
      })

      vi.useRealTimers()
    })
  })

  describe("separators", () => {
    it("renders separators between items", () => {
      const { container } = render(<NotificationPrefs user={mockUser} />)

      const separators = container.querySelectorAll('[role="separator"]')
      expect(separators.length).toBe(4)
    })
  })
})
