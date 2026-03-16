"use client"

import { useMemo } from "react"
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Info,
  Loader2,
  XCircle,
} from "lucide-react"

import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

export interface SchemaValidationError {
  path: string
  message: string
  severity: "error" | "warning" | "info"
  line?: number
  column?: number
  schemaPath?: string
  keyword?: string
  params?: Record<string, unknown>
}

export interface JSONSchema {
  $schema?: string
  $id?: string
  type?: string | string[]
  properties?: Record<string, JSONSchema>
  required?: string[]
  additionalProperties?: boolean | JSONSchema
  items?: JSONSchema | { anyOf: JSONSchema[] }
  enum?: unknown[]
  const?: unknown
  format?: string
  pattern?: string
  minLength?: number
  maxLength?: number
  minimum?: number
  maximum?: number
  exclusiveMinimum?: number | boolean
  exclusiveMaximum?: number | boolean
  multipleOf?: number
  minItems?: number
  maxItems?: number
  uniqueItems?: boolean
  description?: string
  title?: string
  default?: unknown
  examples?: unknown[]
  oneOf?: JSONSchema[]
  anyOf?: JSONSchema[]
  allOf?: JSONSchema[]
  not?: JSONSchema
  if?: JSONSchema
  then?: JSONSchema
  else?: JSONSchema
  $ref?: string
  definitions?: Record<string, JSONSchema>
  $defs?: Record<string, JSONSchema>
}

export interface ConfigValidationPanelProps
  extends Omit<ComponentProps<"div">, "onErrorClick"> {
  errors: SchemaValidationError[]
  isValidating?: boolean
  schema?: JSONSchema
  onErrorClick?: (error: SchemaValidationError) => void
  showCounts?: boolean
  emptyTitle?: string
  emptyDescription?: string
  maxHeight?: string | number
}

function ErrorItem({
  error,
  onErrorClick,
}: {
  error: SchemaValidationError
  onErrorClick?: (error: SchemaValidationError) => void
}) {
  const handleClick = () => {
    onErrorClick?.(error)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onErrorClick?.(error)
    }
  }

  const severityConfig = {
    error: {
      icon: XCircle,
      bgColor: "bg-destructive/5",
      borderColor: "border-destructive/20",
      iconColor: "text-destructive",
      titleColor: "text-destructive",
    },
    warning: {
      icon: AlertCircle,
      bgColor: "bg-yellow-50 dark:bg-yellow-950",
      borderColor: "border-yellow-200 dark:border-yellow-800",
      iconColor: "text-yellow-600 dark:text-yellow-400",
      titleColor: "text-yellow-700 dark:text-yellow-400",
    },
    info: {
      icon: Info,
      bgColor: "bg-blue-50 dark:bg-blue-950",
      borderColor: "border-blue-200 dark:border-blue-800",
      iconColor: "text-blue-600 dark:text-blue-400",
      titleColor: "text-blue-700 dark:text-blue-400",
    },
  }

  const config = severityConfig[error.severity]
  const Icon = config.icon

  const content = (
    <div
      className={cn(
        "p-3 rounded-lg border transition-colors",
        config.bgColor,
        config.borderColor,
        onErrorClick && "cursor-pointer hover:opacity-80"
      )}
      onClick={onErrorClick ? handleClick : undefined}
      onKeyDown={onErrorClick ? handleKeyDown : undefined}
      role={onErrorClick ? "button" : undefined}
      tabIndex={onErrorClick ? 0 : undefined}
    >
      <div className="flex items-start gap-2">
        <Icon className={cn("size-4 mt-0.5 shrink-0", config.iconColor)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p
              className={cn("text-sm font-medium truncate", config.titleColor)}
            >
              {error.path}
            </p>
            {onErrorClick && (
              <ChevronRight className="size-3 shrink-0 text-muted-foreground" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 break-words">
            {error.message}
          </p>
          {(error.line !== undefined || error.column !== undefined) && (
            <p className="text-xs text-muted-foreground/70 mt-1">
              {error.line !== undefined && `Line ${error.line}`}
              {error.line !== undefined && error.column !== undefined && ", "}
              {error.column !== undefined && `Column ${error.column}`}
            </p>
          )}
        </div>
      </div>
    </div>
  )

  return content
}

export function ConfigValidationPanel({
  errors,
  isValidating = false,
  schema,
  onErrorClick,
  showCounts = true,
  emptyTitle = "Configuration Valid",
  emptyDescription = "No validation errors detected",
  maxHeight,
  className,
  ...props
}: ConfigValidationPanelProps) {
  const { errorCount, warningCount, infoCount, sortedErrors } = useMemo(() => {
    const errorCount = errors.filter((e) => e.severity === "error").length
    const warningCount = errors.filter((e) => e.severity === "warning").length
    const infoCount = errors.filter((e) => e.severity === "info").length

    const sortedErrors = [...errors].sort((a, b) => {
      const severityOrder = { error: 0, warning: 1, info: 2 }
      return severityOrder[a.severity] - severityOrder[b.severity]
    })

    return { errorCount, warningCount, infoCount, sortedErrors }
  }, [errors])

  const hasSchema = !!schema

  return (
    <div
      data-slot="config-validation-panel"
      className={cn("h-full flex flex-col", className)}
      {...props}
    >
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Validation</h3>
            {hasSchema && (
              <Badge variant="outline" className="text-xs">
                Schema
              </Badge>
            )}
          </div>
          {isValidating ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : errorCount === 0 && warningCount === 0 ? (
            <CheckCircle2 className="size-4 text-green-500" />
          ) : (
            showCounts && (
              <div className="flex items-center gap-2">
                {errorCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {errorCount} error{errorCount !== 1 ? "s" : ""}
                  </Badge>
                )}
                {warningCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  >
                    {warningCount} warning{warningCount !== 1 ? "s" : ""}
                  </Badge>
                )}
                {infoCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    {infoCount} info
                  </Badge>
                )}
              </div>
            )
          )}
        </div>
      </div>

      <ScrollArea
        className="flex-1"
        style={maxHeight ? { maxHeight } : undefined}
      >
        <div className="p-4">
          {isValidating ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Validating...</p>
            </div>
          ) : errors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="size-10 text-green-500 mb-2" />
              <p className="font-medium">{emptyTitle}</p>
              <p className="text-sm text-muted-foreground">
                {emptyDescription}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedErrors.map((error, index) => (
                <ErrorItem
                  key={`${error.path}-${error.message}-${index}`}
                  error={error}
                  onErrorClick={onErrorClick}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

export function validateAgainstSchema(
  data: unknown,
  schema: JSONSchema
): SchemaValidationError[] {
  const errors: SchemaValidationError[] = []

  function validate(
    value: unknown,
    schemaNode: JSONSchema,
    path: string,
    schemaPath: string
  ) {
    if (schemaNode.type) {
      const types = Array.isArray(schemaNode.type)
        ? schemaNode.type
        : [schemaNode.type]
      const actualType = Array.isArray(value)
        ? "array"
        : value === null
          ? "null"
          : typeof value

      if (!types.includes(actualType)) {
        errors.push({
          path,
          message: `Expected type ${types.join(" | ")}, got ${actualType}`,
          severity: "error",
          schemaPath,
          keyword: "type",
          params: { expected: types, actual: actualType },
        })
        return
      }
    }

    if (schemaNode.enum && !schemaNode.enum.includes(value)) {
      errors.push({
        path,
        message: `Value must be one of: ${schemaNode.enum.join(", ")}`,
        severity: "error",
        schemaPath,
        keyword: "enum",
        params: { allowedValues: schemaNode.enum },
      })
    }

    if (schemaNode.const !== undefined && value !== schemaNode.const) {
      errors.push({
        path,
        message: `Value must be ${JSON.stringify(schemaNode.const)}`,
        severity: "error",
        schemaPath,
        keyword: "const",
      })
    }

    if (typeof value === "string") {
      if (
        schemaNode.minLength !== undefined &&
        value.length < schemaNode.minLength
      ) {
        errors.push({
          path,
          message: `String must be at least ${schemaNode.minLength} characters`,
          severity: "error",
          schemaPath,
          keyword: "minLength",
        })
      }

      if (
        schemaNode.maxLength !== undefined &&
        value.length > schemaNode.maxLength
      ) {
        errors.push({
          path,
          message: `String must be at most ${schemaNode.maxLength} characters`,
          severity: "error",
          schemaPath,
          keyword: "maxLength",
        })
      }

      if (schemaNode.pattern && !new RegExp(schemaNode.pattern).test(value)) {
        errors.push({
          path,
          message: `String must match pattern: ${schemaNode.pattern}`,
          severity: "error",
          schemaPath,
          keyword: "pattern",
        })
      }
    }

    if (typeof value === "number") {
      if (schemaNode.minimum !== undefined && value < schemaNode.minimum) {
        errors.push({
          path,
          message: `Value must be >= ${schemaNode.minimum}`,
          severity: "error",
          schemaPath,
          keyword: "minimum",
        })
      }

      if (schemaNode.maximum !== undefined && value > schemaNode.maximum) {
        errors.push({
          path,
          message: `Value must be <= ${schemaNode.maximum}`,
          severity: "error",
          schemaPath,
          keyword: "maximum",
        })
      }

      if (
        schemaNode.exclusiveMinimum !== undefined &&
        typeof schemaNode.exclusiveMinimum === "number" &&
        value <= schemaNode.exclusiveMinimum
      ) {
        errors.push({
          path,
          message: `Value must be > ${schemaNode.exclusiveMinimum}`,
          severity: "error",
          schemaPath,
          keyword: "exclusiveMinimum",
        })
      }

      if (
        schemaNode.exclusiveMaximum !== undefined &&
        typeof schemaNode.exclusiveMaximum === "number" &&
        value >= schemaNode.exclusiveMaximum
      ) {
        errors.push({
          path,
          message: `Value must be < ${schemaNode.exclusiveMaximum}`,
          severity: "error",
          schemaPath,
          keyword: "exclusiveMaximum",
        })
      }
    }

    if (Array.isArray(value)) {
      if (
        schemaNode.minItems !== undefined &&
        value.length < schemaNode.minItems
      ) {
        errors.push({
          path,
          message: `Array must have at least ${schemaNode.minItems} items`,
          severity: "error",
          schemaPath,
          keyword: "minItems",
        })
      }

      if (
        schemaNode.maxItems !== undefined &&
        value.length > schemaNode.maxItems
      ) {
        errors.push({
          path,
          message: `Array must have at most ${schemaNode.maxItems} items`,
          severity: "error",
          schemaPath,
          keyword: "maxItems",
        })
      }

      if (schemaNode.uniqueItems && new Set(value).size !== value.length) {
        errors.push({
          path,
          message: "Array items must be unique",
          severity: "error",
          schemaPath,
          keyword: "uniqueItems",
        })
      }

      if (schemaNode.items) {
        const itemsSchema = Array.isArray(schemaNode.items)
          ? schemaNode.items
          : [schemaNode.items]

        value.forEach((item, index) => {
          const itemSchema =
            itemsSchema[Math.min(index, itemsSchema.length - 1)]
          if (itemSchema) {
            validate(
              item,
              itemSchema,
              `${path}[${index}]`,
              `${schemaPath}/items/${index}`
            )
          }
        })
      }
    }

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      if (schemaNode.required) {
        schemaNode.required.forEach((requiredKey) => {
          if (!(requiredKey in value)) {
            errors.push({
              path: `${path}.${requiredKey}`,
              message: `Required property "${requiredKey}" is missing`,
              severity: "error",
              schemaPath: `${schemaPath}/required`,
              keyword: "required",
              params: { missingProperty: requiredKey },
            })
          }
        })
      }

      if (schemaNode.properties) {
        Object.entries(value).forEach(([key, val]) => {
          if (schemaNode.properties && schemaNode.properties[key]) {
            validate(
              val,
              schemaNode.properties[key],
              path ? `${path}.${key}` : key,
              `${schemaPath}/properties/${key}`
            )
          } else if (
            schemaNode.additionalProperties === false &&
            !schemaNode.required?.includes(key)
          ) {
            errors.push({
              path: path ? `${path}.${key}` : key,
              message: `Additional property "${key}" is not allowed`,
              severity: "warning",
              schemaPath: `${schemaPath}/additionalProperties`,
              keyword: "additionalProperties",
              params: { additionalProperty: key },
            })
          }
        })
      }
    }
  }

  validate(data, schema, "", "#")
  return errors
}

export function useSchemaValidation(
  data: unknown,
  schema: JSONSchema | undefined,
  enabled: boolean = true
): SchemaValidationError[] {
  return useMemo(() => {
    if (!enabled || !schema) return []
    return validateAgainstSchema(data, schema)
  }, [data, schema, enabled])
}
