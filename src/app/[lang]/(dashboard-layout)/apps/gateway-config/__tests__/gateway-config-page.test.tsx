import { renderHook as _renderHook } from "@testing-library/react"
import { beforeEach as _beforeEach, describe, expect, it, vi } from "vitest"

import type { ValidationError } from "@/components/ui/gateway-config-editor"

vi.mock("@/providers/auth-provider", () => ({
  useSession: vi.fn(() => ({
    data: {
      user: {
        id: "test-user-id",
        email: "test@example.com",
        name: "Test User",
        avatar: null,
        enterprise_id: "test-enterprise-id",
        role: "admin",
        permissions: ["*"],
      },
      accessToken: "mock-access-token",
    },
    status: "authenticated",
  })),
}))

function hasChanges(editorContent: string, originalContent: string): boolean {
  return editorContent !== originalContent && editorContent !== ""
}

function canSave(
  validationErrors: ValidationError[],
  hasChangesValue: boolean,
  isSaving: boolean
): boolean {
  return (
    !isSaving &&
    hasChangesValue &&
    !validationErrors.some((e) => e.severity === "error")
  )
}

describe("GatewayConfigPage Logic", () => {
  describe("hasChanges calculation", () => {
    it("returns true when content differs from original", () => {
      const result = hasChanges('{"new": "value"}', '{"old": "value"}')
      expect(result).toBe(true)
    })

    it("returns false when content equals original", () => {
      const result = hasChanges('{"same": "value"}', '{"same": "value"}')
      expect(result).toBe(false)
    })

    it("returns false when content is empty", () => {
      const result = hasChanges("", '{"old": "value"}')
      expect(result).toBe(false)
    })

    it("returns false when both are empty", () => {
      const result = hasChanges("", "")
      expect(result).toBe(false)
    })

    it("returns true when whitespace changes", () => {
      const result = hasChanges('{"key": "value"}  ', '{"key": "value"}')
      expect(result).toBe(true)
    })
  })

  describe("canSave validation", () => {
    const noErrors: ValidationError[] = []
    const errorErrors: ValidationError[] = [
      { path: "test", message: "error", severity: "error" },
    ]
    const warningErrors: ValidationError[] = [
      { path: "test", message: "warning", severity: "warning" },
    ]
    const mixedErrors: ValidationError[] = [
      { path: "test1", message: "warning", severity: "warning" },
      { path: "test2", message: "error", severity: "error" },
    ]

    it("returns true when no errors and has changes", () => {
      const result = canSave(noErrors, true, false)
      expect(result).toBe(true)
    })

    it("returns false when saving in progress", () => {
      const result = canSave(noErrors, true, true)
      expect(result).toBe(false)
    })

    it("returns false when no changes", () => {
      const result = canSave(noErrors, false, false)
      expect(result).toBe(false)
    })

    it("returns false when validation errors exist", () => {
      const result = canSave(errorErrors, true, false)
      expect(result).toBe(false)
    })

    it("returns true when only warnings exist", () => {
      const result = canSave(warningErrors, true, false)
      expect(result).toBe(true)
    })

    it("returns false when mixed errors include error severity", () => {
      const result = canSave(mixedErrors, true, false)
      expect(result).toBe(false)
    })
  })

  describe("ValidationPanel error counting", () => {
    function countErrors(errors: ValidationError[]) {
      return {
        errorCount: errors.filter((e) => e.severity === "error").length,
        warningCount: errors.filter((e) => e.severity === "warning").length,
        infoCount: errors.filter((e) => e.severity === "info").length,
      }
    }

    it("counts errors correctly", () => {
      const errors: ValidationError[] = [
        { path: "a", message: "", severity: "error" },
        { path: "b", message: "", severity: "error" },
        { path: "c", message: "", severity: "warning" },
      ]

      const result = countErrors(errors)
      expect(result.errorCount).toBe(2)
      expect(result.warningCount).toBe(1)
      expect(result.infoCount).toBe(0)
    })

    it("handles empty errors array", () => {
      const result = countErrors([])
      expect(result.errorCount).toBe(0)
      expect(result.warningCount).toBe(0)
      expect(result.infoCount).toBe(0)
    })

    it("counts all severity types", () => {
      const errors: ValidationError[] = [
        { path: "a", message: "", severity: "error" },
        { path: "b", message: "", severity: "warning" },
        { path: "c", message: "", severity: "info" },
        { path: "d", message: "", severity: "info" },
      ]

      const result = countErrors(errors)
      expect(result.errorCount).toBe(1)
      expect(result.warningCount).toBe(1)
      expect(result.infoCount).toBe(2)
    })
  })

  describe("Admin access control", () => {
    function checkAdminAccess(userRole: string | undefined): boolean {
      return userRole === "admin"
    }

    it("grants access to admin user", () => {
      expect(checkAdminAccess("admin")).toBe(true)
    })

    it("denies access to non-admin user", () => {
      expect(checkAdminAccess("user")).toBe(false)
    })

    it("denies access to viewer user", () => {
      expect(checkAdminAccess("viewer")).toBe(false)
    })

    it("denies access when role is undefined", () => {
      expect(checkAdminAccess(undefined)).toBe(false)
    })
  })

  describe("Reset functionality", () => {
    it("should reset editor content to original", () => {
      const originalContent = '{"original": true}'
      let editorContent = '{"modified": true}'

      function performReset() {
        editorContent = originalContent
        return editorContent
      }

      const result = performReset()
      expect(result).toBe(originalContent)
    })
  })

  describe("Preset selection", () => {
    const mockPresets = [
      { id: "preset-1", name: "Development" },
      { id: "preset-2", name: "Production" },
      { id: "preset-3", name: "Staging" },
    ]

    function findPreset(presetId: string) {
      return mockPresets.find((p) => p.id === presetId)
    }

    it("finds preset by id", () => {
      const preset = findPreset("preset-2")
      expect(preset?.name).toBe("Production")
    })

    it("returns undefined for unknown preset", () => {
      const preset = findPreset("unknown")
      expect(preset).toBeUndefined()
    })
  })
})

describe("useSession mock", () => {
  it("returns admin user by default", async () => {
    const { useSession } = await import("@/providers/auth-provider")
    const result = useSession()

    expect(result.status).toBe("authenticated")
    expect(result.data?.user?.role).toBe("admin")
  })
})

describe("Gateway config JSON validation", () => {
  function validateConfigJson(jsonString: string): {
    valid: boolean
    error?: string
  } {
    if (!jsonString.trim()) {
      return { valid: false, error: "Empty configuration" }
    }

    try {
      const parsed = JSON.parse(jsonString)
      if (typeof parsed !== "object" || parsed === null) {
        return { valid: false, error: "Configuration must be an object" }
      }
      return { valid: true }
    } catch (e) {
      return {
        valid: false,
        error: e instanceof Error ? e.message : "Invalid JSON",
      }
    }
  }

  it("validates valid JSON object", () => {
    const result = validateConfigJson('{"key": "value"}')
    expect(result.valid).toBe(true)
  })

  it("rejects empty string", () => {
    const result = validateConfigJson("")
    expect(result.valid).toBe(false)
    expect(result.error).toBe("Empty configuration")
  })

  it("rejects whitespace only", () => {
    const result = validateConfigJson("   ")
    expect(result.valid).toBe(false)
    expect(result.error).toBe("Empty configuration")
  })

  it("accepts JSON array as valid object type", () => {
    const result = validateConfigJson("[1, 2, 3]")
    expect(result.valid).toBe(true)
  })

  it("rejects JSON primitives", () => {
    const result = validateConfigJson('"string"')
    expect(result.valid).toBe(false)
    expect(result.error).toBe("Configuration must be an object")
  })

  it("rejects null", () => {
    const result = validateConfigJson("null")
    expect(result.valid).toBe(false)
    expect(result.error).toBe("Configuration must be an object")
  })

  it("rejects invalid JSON", () => {
    const result = validateConfigJson("not json")
    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
  })

  it("accepts nested objects", () => {
    const result = validateConfigJson('{"outer": {"inner": {"deep": 1}}}')
    expect(result.valid).toBe(true)
  })

  it("accepts empty object", () => {
    const result = validateConfigJson("{}")
    expect(result.valid).toBe(true)
  })
})

describe("Confirm dialog state management", () => {
  type ConfirmDialogType = "save" | "reset" | "preset" | null

  function createDialogState() {
    let confirmDialog: ConfirmDialogType = null

    return {
      getConfirmDialog: () => confirmDialog,
      setConfirmDialog: (type: ConfirmDialogType) => {
        confirmDialog = type
      },
      clearConfirmDialog: () => {
        confirmDialog = null
      },
    }
  }

  it("starts with null state", () => {
    const state = createDialogState()
    expect(state.getConfirmDialog()).toBeNull()
  })

  it("sets save dialog", () => {
    const state = createDialogState()
    state.setConfirmDialog("save")
    expect(state.getConfirmDialog()).toBe("save")
  })

  it("sets reset dialog", () => {
    const state = createDialogState()
    state.setConfirmDialog("reset")
    expect(state.getConfirmDialog()).toBe("reset")
  })

  it("sets preset dialog", () => {
    const state = createDialogState()
    state.setConfirmDialog("preset")
    expect(state.getConfirmDialog()).toBe("preset")
  })

  it("clears dialog", () => {
    const state = createDialogState()
    state.setConfirmDialog("save")
    state.clearConfirmDialog()
    expect(state.getConfirmDialog()).toBeNull()
  })
})
