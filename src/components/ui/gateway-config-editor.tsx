"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Editor from "@monaco-editor/react"

import type { Monaco } from "@monaco-editor/react"
import type { editor } from "monaco-editor"
import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

export interface ValidationError {
  path: string
  message: string
  severity: "error" | "warning" | "info"
  line?: number
  column?: number
}

export interface GatewayConfigEditorProps
  extends Omit<ComponentProps<"div">, "onChange"> {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  onValidate?: (errors: ValidationError[]) => void
  onEditorMount?: (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => void
  height?: string | number
  readOnly?: boolean
  minimap?: boolean
  fontSize?: number
  lineNumbers?: "on" | "off" | "relative"
  wordWrap?: "on" | "off" | "bounded" | "wordWrapColumn"
  tabSize?: number
  formatOnPaste?: boolean
  formatOnType?: boolean
  schema?: Record<string, unknown>
  theme?: "vs-dark" | "light" | "hc-black"
}

export function GatewayConfigEditor({
  value,
  defaultValue = "{}",
  onChange,
  onValidate,
  onEditorMount,
  height = "100%",
  readOnly = false,
  minimap = true,
  fontSize = 14,
  lineNumbers = "on",
  wordWrap = "on",
  tabSize = 2,
  formatOnPaste = true,
  formatOnType = true,
  schema,
  theme = "vs-dark",
  className,
  ...props
}: GatewayConfigEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const [internalValue, setInternalValue] = useState(defaultValue)
  const [isLoaded, setIsLoaded] = useState(false)

  const currentValue = value ?? internalValue

  const validateJson = useCallback((jsonString: string): ValidationError[] => {
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
          const lastLine = lines[lines.length - 1]
          column = (lastLine?.length ?? 0) + 1
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
  }, [])

  const updateMarkers = useCallback((errors: ValidationError[]) => {
    if (!editorRef.current || !monacoRef.current) return

    const monaco = monacoRef.current
    const model = editorRef.current.getModel()

    if (!model) return

    const markers = errors
      .filter((e) => e.line !== undefined)
      .map((error) => ({
        severity:
          error.severity === "error"
            ? monaco.MarkerSeverity.Error
            : error.severity === "warning"
              ? monaco.MarkerSeverity.Warning
              : monaco.MarkerSeverity.Info,
        message: error.message,
        startLineNumber: error.line ?? 1,
        startColumn: error.column ?? 1,
        endLineNumber: error.line ?? 1,
        endColumn: (error.column ?? 1) + 10,
      }))

    monaco.editor.setModelMarkers(model, "gateway-config", markers)
  }, [])

  const handleChange = useCallback(
    (newValue: string | undefined) => {
      const updatedValue = newValue ?? ""

      if (value === undefined) {
        setInternalValue(updatedValue)
      }

      onChange?.(updatedValue)

      const errors = validateJson(updatedValue)
      updateMarkers(errors)
      onValidate?.(errors)
    },
    [value, onChange, onValidate, validateJson, updateMarkers]
  )

  const handleEditorDidMount = useCallback(
    (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
      editorRef.current = editor
      monacoRef.current = monaco
      setIsLoaded(true)

      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        schemas: schema
          ? [
              {
                uri: "http://gateway-config/schema.json",
                fileMatch: ["*"],
                schema: schema,
              },
            ]
          : [],
        enableSchemaRequest: false,
        allowComments: false,
        trailingCommas: "error",
      })

      onEditorMount?.(editor, monaco)
    },
    [schema, onEditorMount]
  )

  useEffect(() => {
    if (isLoaded && currentValue) {
      const errors = validateJson(currentValue)
      updateMarkers(errors)
    }
  }, [isLoaded, currentValue, validateJson, updateMarkers])

  return (
    <div
      data-slot="gateway-config-editor"
      className={cn("h-full w-full", className)}
      {...props}
    >
      <Editor
        height={height}
        defaultLanguage="json"
        value={currentValue}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        theme={theme}
        loading={
          <div className="flex items-center justify-center h-full bg-muted">
            <span className="text-muted-foreground">Loading editor...</span>
          </div>
        }
        options={{
          minimap: { enabled: minimap },
          fontSize,
          lineNumbers,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize,
          formatOnPaste,
          formatOnType,
          wordWrap,
          readOnly,
          folding: true,
          foldingHighlight: true,
          showFoldingControls: "mouseover",
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
          quickSuggestions: true,
          suggest: {
            showProperties: true,
            showKeywords: true,
          },
          scrollbar: {
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
          padding: { top: 8, bottom: 8 },
        }}
      />
    </div>
  )
}

export function useGatewayConfigEditor() {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  const setEditor = useCallback((editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor
  }, [])

  const getValue = useCallback(() => {
    return editorRef.current?.getValue() ?? ""
  }, [])

  const setValue = useCallback((value: string) => {
    editorRef.current?.setValue(value)
  }, [])

  const format = useCallback(() => {
    editorRef.current?.getAction("editor.action.formatDocument")?.run()
  }, [])

  const focus = useCallback(() => {
    editorRef.current?.focus()
  }, [])

  const getEditor = useCallback(() => editorRef.current, [])

  return {
    setEditor,
    getValue,
    setValue,
    format,
    focus,
    getEditor,
  }
}
