import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { ValidationError } from "../gateway-config-editor"

import { useGatewayConfigEditor } from "../gateway-config-editor"

function validateJson(jsonString: string): ValidationError[] {
  const errors: ValidationError[] = []

  if (!jsonString.trim()) {
    return []
  }

  try {
    JSON.parse(jsonString)
  } catch (e) {
    const error = e as Error
    const match = error.message.match(
      /at position (\d+)|line (\d+) column (\d+)/
    )

    let line: number | undefined
    let column: number | undefined

    if (match) {
      if (match[1]) {
        const position = parseInt(match[1], 10)
        const lines = jsonString.substring(0, position).split("\n")
        line = lines.length
        column = lines[lines.length - 1]!.length + 1
      } else if (match[2] && match[3]) {
        line = parseInt(match[2], 10)
        column = parseInt(match[3], 10)
      }
    }

    errors.push({
      path: "JSON Parse Error",
      message: error.message,
      severity: "error",
      line,
      column,
    })
  }

  return errors
}

describe("validateJson", () => {
  describe("valid JSON", () => {
    it("returns empty array for valid JSON object", () => {
      const result = validateJson('{"key": "value"}')
      expect(result).toEqual([])
    })

    it("returns empty array for valid JSON array", () => {
      const result = validateJson("[1, 2, 3]")
      expect(result).toEqual([])
    })

    it("returns empty array for valid nested JSON", () => {
      const result = validateJson('{"outer": {"inner": {"deep": 1}}}')
      expect(result).toEqual([])
    })

    it("returns empty array for empty object", () => {
      const result = validateJson("{}")
      expect(result).toEqual([])
    })

    it("returns empty array for empty string", () => {
      const result = validateJson("")
      expect(result).toEqual([])
    })

    it("returns empty array for whitespace only", () => {
      const result = validateJson("   ")
      expect(result).toEqual([])
    })
  })

  describe("invalid JSON", () => {
    it("returns error for missing closing brace", () => {
      const result = validateJson('{"key": "value"')
      expect(result).toHaveLength(1)
      expect(result[0]?.severity).toBe("error")
      expect(result[0]?.message).toMatch(/expected/i)
    })

    it("returns error for missing closing bracket", () => {
      const result = validateJson("[1, 2, 3")
      expect(result).toHaveLength(1)
      expect(result[0]?.severity).toBe("error")
    })

    it("returns error for trailing comma", () => {
      const result = validateJson('{"key": "value",}')
      expect(result).toHaveLength(1)
      expect(result[0]?.severity).toBe("error")
    })

    it("returns error for unquoted key", () => {
      const result = validateJson('{key: "value"}')
      expect(result).toHaveLength(1)
      expect(result[0]?.severity).toBe("error")
    })

    it("returns error for single quotes", () => {
      const result = validateJson("{'key': 'value'}")
      expect(result).toHaveLength(1)
      expect(result[0]?.severity).toBe("error")
    })

    it("returns error for malformed JSON", () => {
      const result = validateJson("not json")
      expect(result).toHaveLength(1)
      expect(result[0]?.severity).toBe("error")
    })
  })

  describe("line and column detection", () => {
    it("detects error line and column for multiline JSON", () => {
      const json = `{
  "key": "value"
  "another": "missing comma"
}`
      const result = validateJson(json)
      expect(result[0]?.line).toBeDefined()
      expect(result[0]?.column).toBeDefined()
    })

    it("handles position-based error parsing", () => {
      const json = '{"key": value}'
      const result = validateJson(json)
      expect(result).toHaveLength(1)
    })
  })
})

describe("useGatewayConfigEditor", () => {
  const mockEditor = {
    getValue: vi.fn(),
    setValue: vi.fn(),
    getAction: vi.fn(),
    focus: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockEditor.getAction.mockReturnValue({
      run: vi.fn(),
    })
  })

  describe("setEditor", () => {
    it("stores editor reference", () => {
      const { result } = renderHook(() => useGatewayConfigEditor())

      act(() => {
        result.current.setEditor(mockEditor as unknown as never)
      })

      expect(result.current.getEditor()).toBe(mockEditor)
    })
  })

  describe("getValue", () => {
    it("returns editor value", () => {
      const { result } = renderHook(() => useGatewayConfigEditor())
      mockEditor.getValue.mockReturnValue('{"test": "value"}')

      act(() => {
        result.current.setEditor(mockEditor as unknown as never)
      })

      const value = result.current.getValue()
      expect(value).toBe('{"test": "value"}')
      expect(mockEditor.getValue).toHaveBeenCalled()
    })

    it("returns empty string when editor is null", () => {
      const { result } = renderHook(() => useGatewayConfigEditor())

      const value = result.current.getValue()
      expect(value).toBe("")
    })
  })

  describe("setValue", () => {
    it("sets editor value", () => {
      const { result } = renderHook(() => useGatewayConfigEditor())

      act(() => {
        result.current.setEditor(mockEditor as unknown as never)
      })

      act(() => {
        result.current.setValue('{"new": "value"}')
      })

      expect(mockEditor.setValue).toHaveBeenCalledWith('{"new": "value"}')
    })

    it("does nothing when editor is null", () => {
      const { result } = renderHook(() => useGatewayConfigEditor())

      act(() => {
        result.current.setValue('{"new": "value"}')
      })

      expect(mockEditor.setValue).not.toHaveBeenCalled()
    })
  })

  describe("format", () => {
    it("calls format document action", () => {
      const mockRun = vi.fn()
      mockEditor.getAction.mockReturnValue({ run: mockRun })

      const { result } = renderHook(() => useGatewayConfigEditor())

      act(() => {
        result.current.setEditor(mockEditor as unknown as never)
      })

      act(() => {
        result.current.format()
      })

      expect(mockEditor.getAction).toHaveBeenCalledWith(
        "editor.action.formatDocument"
      )
      expect(mockRun).toHaveBeenCalled()
    })

    it("does nothing when editor is null", () => {
      const { result } = renderHook(() => useGatewayConfigEditor())

      act(() => {
        result.current.format()
      })

      expect(mockEditor.getAction).not.toHaveBeenCalled()
    })

    it("does nothing when action is not found", () => {
      mockEditor.getAction.mockReturnValue(null)

      const { result } = renderHook(() => useGatewayConfigEditor())

      act(() => {
        result.current.setEditor(mockEditor as unknown as never)
      })

      act(() => {
        result.current.format()
      })

      expect(mockEditor.getAction).toHaveBeenCalled()
    })
  })

  describe("focus", () => {
    it("calls focus on editor", () => {
      const { result } = renderHook(() => useGatewayConfigEditor())

      act(() => {
        result.current.setEditor(mockEditor as unknown as never)
      })

      act(() => {
        result.current.focus()
      })

      expect(mockEditor.focus).toHaveBeenCalled()
    })

    it("does nothing when editor is null", () => {
      const { result } = renderHook(() => useGatewayConfigEditor())

      act(() => {
        result.current.focus()
      })

      expect(mockEditor.focus).not.toHaveBeenCalled()
    })
  })

  describe("getEditor", () => {
    it("returns null when no editor set", () => {
      const { result } = renderHook(() => useGatewayConfigEditor())

      expect(result.current.getEditor()).toBeNull()
    })

    it("returns editor when set", () => {
      const { result } = renderHook(() => useGatewayConfigEditor())

      act(() => {
        result.current.setEditor(mockEditor as unknown as never)
      })

      expect(result.current.getEditor()).toBe(mockEditor)
    })
  })
})

describe("ValidationError", () => {
  it("has required properties", () => {
    const error: ValidationError = {
      path: "test.path",
      message: "Test error message",
      severity: "error",
      line: 1,
      column: 10,
    }

    expect(error.path).toBe("test.path")
    expect(error.message).toBe("Test error message")
    expect(error.severity).toBe("error")
    expect(error.line).toBe(1)
    expect(error.column).toBe(10)
  })

  it("supports all severity levels", () => {
    const errorError: ValidationError = {
      path: "test",
      message: "error",
      severity: "error",
    }
    const warningError: ValidationError = {
      path: "test",
      message: "warning",
      severity: "warning",
    }
    const infoError: ValidationError = {
      path: "test",
      message: "info",
      severity: "info",
    }

    expect(errorError.severity).toBe("error")
    expect(warningError.severity).toBe("warning")
    expect(infoError.severity).toBe("info")
  })

  it("line and column are optional", () => {
    const error: ValidationError = {
      path: "test",
      message: "error without location",
      severity: "error",
    }

    expect(error.line).toBeUndefined()
    expect(error.column).toBeUndefined()
  })
})
