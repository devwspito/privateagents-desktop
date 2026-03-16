import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  AUTONOMY_LEVELS,
  AutonomyLevelDropdown,
  autonomyLevelDescriptions,
  autonomyLevelLabels,
} from "../autonomy-level-dropdown"

describe("AutonomyLevelDropdown", () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  describe("exports and constants", () => {
    it("exports correct autonomy levels", () => {
      expect(AUTONOMY_LEVELS).toEqual(["full", "supervised", "manual"])
    })

    it("exports correct labels for all levels", () => {
      expect(autonomyLevelLabels).toEqual({
        full: "Full Autonomy",
        supervised: "Supervised",
        manual: "Manual",
      })
    })

    it("exports correct descriptions for all levels", () => {
      expect(autonomyLevelDescriptions).toEqual({
        full: "Can act independently without approval",
        supervised: "Most actions require approval",
        manual: "All actions require approval",
      })
    })
  })

  describe("rendering", () => {
    it("renders with placeholder when no value is selected", () => {
      render(
        <AutonomyLevelDropdown value={undefined} onChange={mockOnChange} />
      )
      expect(screen.getByText("Select autonomy level")).toBeInTheDocument()
    })

    it("renders with custom placeholder", () => {
      render(
        <AutonomyLevelDropdown
          value={undefined}
          onChange={mockOnChange}
          placeholder="Choose level"
        />
      )
      expect(screen.getByText("Choose level")).toBeInTheDocument()
    })

    it("renders selected value with label and icon", () => {
      render(<AutonomyLevelDropdown value="full" onChange={mockOnChange} />)
      expect(screen.getByText("Full Autonomy")).toBeInTheDocument()
    })

    it("renders supervised level correctly", () => {
      render(
        <AutonomyLevelDropdown value="supervised" onChange={mockOnChange} />
      )
      expect(screen.getByText("Supervised")).toBeInTheDocument()
    })

    it("renders manual level correctly", () => {
      render(<AutonomyLevelDropdown value="manual" onChange={mockOnChange} />)
      expect(screen.getByText("Manual")).toBeInTheDocument()
    })

    it("renders as disabled when disabled prop is true", () => {
      const { container } = render(
        <AutonomyLevelDropdown value="full" onChange={mockOnChange} disabled />
      )
      const trigger = container.querySelector("button")
      expect(trigger).toBeDisabled()
    })
  })

  describe("disabled state", () => {
    it("does not open dropdown when disabled", async () => {
      render(
        <AutonomyLevelDropdown value="full" onChange={mockOnChange} disabled />
      )

      const trigger = screen.getByRole("combobox")
      expect(trigger).toBeDisabled()
    })

    it("shows selected value even when disabled", () => {
      render(
        <AutonomyLevelDropdown
          value="supervised"
          onChange={mockOnChange}
          disabled
        />
      )
      expect(screen.getByText("Supervised")).toBeInTheDocument()
    })
  })

  describe("edge cases", () => {
    it("handles null value gracefully", () => {
      render(
        <AutonomyLevelDropdown
          value={null as unknown as undefined}
          onChange={mockOnChange}
        />
      )
      expect(screen.getByText("Select autonomy level")).toBeInTheDocument()
    })

    it("handles empty string value", () => {
      render(
        <AutonomyLevelDropdown
          value={"" as "full" | "supervised" | "manual"}
          onChange={mockOnChange}
        />
      )
      expect(screen.getByText("Select autonomy level")).toBeInTheDocument()
    })
  })

  describe("accessibility", () => {
    it("has combobox role", () => {
      render(<AutonomyLevelDropdown value="full" onChange={mockOnChange} />)
      expect(screen.getByRole("combobox")).toBeInTheDocument()
    })

    it("is focusable", () => {
      render(<AutonomyLevelDropdown value="full" onChange={mockOnChange} />)
      const trigger = screen.getByRole("combobox")
      trigger.focus()
      expect(trigger).toHaveFocus()
    })
  })

  describe("visual feedback", () => {
    it("shows correct label for full autonomy", () => {
      render(<AutonomyLevelDropdown value="full" onChange={mockOnChange} />)
      expect(screen.getByText("Full Autonomy")).toBeInTheDocument()
    })

    it("shows correct label for supervised", () => {
      render(
        <AutonomyLevelDropdown value="supervised" onChange={mockOnChange} />
      )
      expect(screen.getByText("Supervised")).toBeInTheDocument()
    })

    it("shows correct label for manual", () => {
      render(<AutonomyLevelDropdown value="manual" onChange={mockOnChange} />)
      expect(screen.getByText("Manual")).toBeInTheDocument()
    })
  })
})
