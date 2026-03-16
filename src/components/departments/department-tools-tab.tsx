"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  Loader2,
  Save,
  Settings2,
  Shield,
  XCircle,
} from "lucide-react"

import type { Department, DepartmentToolsResponse } from "@/lib/api/client"

import { useDepartmentTools, useUpdateDepartmentTools } from "@/lib/api"
import { cn } from "@/lib/utils"

import { toast } from "@/hooks/use-toast"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button, ButtonLoading } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { InputSpin } from "@/components/ui/input-spin"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

const DepartmentToolsSchema = z.object({
  governance_mode: z.enum(["allowlist", "blocklist", "category"]),
  allowed_functions: z.array(z.string()).optional(),
  blocked_functions: z.array(z.string()).optional(),
  require_approval_for: z.array(z.string()).optional(),
  enabled: z.boolean(),
  rate_limits: z
    .object({
      calls_per_minute: z.number().min(1).max(1000),
      calls_per_hour: z.number().min(1).max(10000),
      calls_per_day: z.number().min(1).max(100000),
    })
    .optional(),
  time_restrictions: z
    .object({
      allowed_hours: z.object({
        start: z.string(),
        end: z.string(),
      }),
      allowed_days: z.array(z.string()),
    })
    .optional(),
})

type DepartmentToolsFormType = z.infer<typeof DepartmentToolsSchema>

const COMMON_TOOLS = [
  {
    value: "web_search",
    label: "Web Search",
    description: "Search the internet",
  },
  {
    value: "file_operations",
    label: "File Operations",
    description: "Read/write files",
  },
  { value: "email_send", label: "Send Email", description: "Send emails" },
  {
    value: "calendar",
    label: "Calendar",
    description: "Manage calendar events",
  },
  {
    value: "database_query",
    label: "Database Query",
    description: "Query databases",
  },
  {
    value: "api_request",
    label: "API Request",
    description: "Make external API calls",
  },
  {
    value: "code_execution",
    label: "Code Execution",
    description: "Run code snippets",
  },
  {
    value: "image_generation",
    label: "Image Generation",
    description: "Generate images",
  },
  {
    value: "document_processing",
    label: "Document Processing",
    description: "Process documents",
  },
  {
    value: "crm_operations",
    label: "CRM Operations",
    description: "CRM integration",
  },
] as const

const DAYS_OF_WEEK = [
  { value: "mon", label: "Monday" },
  { value: "tue", label: "Tuesday" },
  { value: "wed", label: "Wednesday" },
  { value: "thu", label: "Thursday" },
  { value: "fri", label: "Friday" },
  { value: "sat", label: "Saturday" },
  { value: "sun", label: "Sunday" },
] as const

interface DepartmentToolsTabProps {
  department: Department
  onUpdate?: (config: DepartmentToolsResponse) => void
}

export function DepartmentToolsTab({
  department,
  onUpdate,
}: DepartmentToolsTabProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [customAllowedTool, setCustomAllowedTool] = useState("")
  const [customBlockedTool, setCustomBlockedTool] = useState("")
  const [customApprovalTool, setCustomApprovalTool] = useState("")

  const {
    data: configData,
    isLoading,
    error,
  } = useDepartmentTools(department.id)
  const updateConfig = useUpdateDepartmentTools()

  const form = useForm<DepartmentToolsFormType>({
    resolver: zodResolver(DepartmentToolsSchema),
    values: configData
      ? {
          governance_mode: (((configData as unknown as Record<string, unknown>)["governance_mode"] as string) ?? "allowlist") as
            | "allowlist"
            | "blocklist"
            | "category",
          allowed_functions: (configData as unknown as Record<string, unknown>)["allowed_functions"] as string[] ?? [],
          blocked_functions: (configData as unknown as Record<string, unknown>)["blocked_functions"] as string[] ?? [],
          require_approval_for: (configData as unknown as Record<string, unknown>)["require_approval_for"] as string[] ?? [],
          enabled: (configData as unknown as Record<string, unknown>)["enabled"] as boolean,
          rate_limits:
            (configData as unknown as Record<string, unknown>)["rate_limits"] as DepartmentToolsFormType["rate_limits"],
          time_restrictions:
            (configData as unknown as Record<string, unknown>)["time_restrictions"] as DepartmentToolsFormType["time_restrictions"],
        }
      : {
          governance_mode: "allowlist",
          allowed_functions: [],
          blocked_functions: [],
          require_approval_for: [],
          enabled: true,
          rate_limits: {
            calls_per_minute: 60,
            calls_per_hour: 1000,
            calls_per_day: 10000,
          },
          time_restrictions: {
            allowed_hours: { start: "09:00", end: "18:00" },
            allowed_days: ["mon", "tue", "wed", "thu", "fri"],
          },
        },
  })

  const { isDirty } = form.formState
  const watchGovernanceMode = form.watch("governance_mode")

  async function onSubmit(data: DepartmentToolsFormType) {
    setIsSaving(true)
    try {
      const result = await updateConfig.mutateAsync({
        departmentId: department.id,
        data: {
          governance_mode: data.governance_mode,
          allowed_functions: data.allowed_functions,
          blocked_functions: data.blocked_functions,
          require_approval_for: data.require_approval_for,
          enabled: data.enabled,
          rate_limits: data.rate_limits,
          time_restrictions: data.time_restrictions,
        } as unknown as DepartmentToolsResponse,
      })

      toast({
        title: "Tools configuration saved",
        description: "Department tools settings have been updated.",
      })

      onUpdate?.(result)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to save configuration",
        description:
          error instanceof Error ? error.message : "An error occurred",
      })
    } finally {
      setIsSaving(false)
    }
  }

  function addCustomTool(
    field: { value: string[] | undefined; onChange: (value: string[]) => void },
    customValue: string,
    setCustomValue: (v: string) => void
  ) {
    if (customValue.trim() && !field.value?.includes(customValue.trim())) {
      field.onChange([...(field.value || []), customValue.trim()])
      setCustomValue("")
    }
  }

  function removeTool(
    field: { value: string[] | undefined; onChange: (value: string[]) => void },
    tool: string
  ) {
    field.onChange(field.value?.filter((t) => t !== tool) || [])
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <AlertTriangle className="size-8 text-destructive" />
          <p className="text-muted-foreground">
            Failed to load tools configuration
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Settings2 className="size-5 text-primary" />
              Tools Configuration
            </h3>
            <p className="text-sm text-muted-foreground">
              Configure which tools agents in{" "}
              {department.display_name || department.name} can use
            </p>
          </div>
          <ButtonLoading
            type="submit"
            isLoading={isSaving}
            disabled={!isDirty}
            icon={Save}
          >
            Save Changes
          </ButtonLoading>
        </div>

        <FormField
          control={form.control}
          name="enabled"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base flex items-center gap-2">
                  {field.value ? (
                    <CheckCircle2 className="size-4 text-green-500" />
                  ) : (
                    <XCircle className="size-4 text-red-500" />
                  )}
                  Tools Enabled
                </FormLabel>
                <FormDescription>
                  Enable or disable all tool usage for this department
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Accordion
          type="multiple"
          defaultValue={["governance", "limits"]}
          className="space-y-4"
        >
          <AccordionItem value="governance">
            <Card>
              <CardHeader className="pb-3">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                      <Shield className="size-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-left">
                      <CardTitle className="text-base">
                        Governance Mode
                      </CardTitle>
                      <CardDescription>
                        Control how tools are allowed or blocked
                      </CardDescription>
                    </div>
                  </div>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent className="space-y-6 pt-4">
                  <FormField
                    control={form.control}
                    name="governance_mode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Governance Mode</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select mode" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="allowlist">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="size-4 text-green-500" />
                                Allowlist - Only specified tools allowed
                              </div>
                            </SelectItem>
                            <SelectItem value="blocklist">
                              <div className="flex items-center gap-2">
                                <Ban className="size-4 text-red-500" />
                                Blocklist - All tools except blocked
                              </div>
                            </SelectItem>
                            <SelectItem value="category">
                              <div className="flex items-center gap-2">
                                <Settings2 className="size-4 text-blue-500" />
                                Category - Control by category
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {watchGovernanceMode === "allowlist"
                            ? "Only tools in the allowed list can be used"
                            : watchGovernanceMode === "blocklist"
                              ? "All tools can be used except those in the blocked list"
                              : "Tools are controlled by their category settings"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {(watchGovernanceMode === "allowlist" ||
                    watchGovernanceMode === "blocklist") && (
                    <>
                      {watchGovernanceMode === "allowlist" && (
                        <FormField
                          control={form.control}
                          name="allowed_functions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Allowed Tools</FormLabel>
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                  {COMMON_TOOLS.map((tool) => (
                                    <div
                                      key={tool.value}
                                      className={cn(
                                        "flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors",
                                        field.value?.includes(tool.value)
                                          ? "border-primary bg-primary/5"
                                          : "hover:border-primary/50"
                                      )}
                                      onClick={() => {
                                        if (field.value?.includes(tool.value)) {
                                          removeTool(field, tool.value)
                                        } else {
                                          field.onChange([
                                            ...(field.value || []),
                                            tool.value,
                                          ])
                                        }
                                      }}
                                    >
                                      <div className="flex-1">
                                        <Label className="cursor-pointer font-medium">
                                          {tool.label}
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                          {tool.description}
                                        </p>
                                      </div>
                                      {field.value?.includes(tool.value) && (
                                        <CheckCircle2 className="size-4 text-primary" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Add custom tool..."
                                    value={customAllowedTool}
                                    onChange={(e) =>
                                      setCustomAllowedTool(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault()
                                        addCustomTool(
                                          field,
                                          customAllowedTool,
                                          setCustomAllowedTool
                                        )
                                      }
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                      addCustomTool(
                                        field,
                                        customAllowedTool,
                                        setCustomAllowedTool
                                      )
                                    }
                                  >
                                    Add
                                  </Button>
                                </div>
                                {field.value && field.value.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {field.value.map((tool) => (
                                      <Badge
                                        key={tool}
                                        variant="secondary"
                                        className="gap-1"
                                      >
                                        {tool}
                                        <button
                                          type="button"
                                          onClick={() =>
                                            removeTool(field, tool)
                                          }
                                          className="ml-1 hover:text-destructive"
                                        >
                                          <XCircle className="size-3" />
                                        </button>
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {watchGovernanceMode === "blocklist" && (
                        <FormField
                          control={form.control}
                          name="blocked_functions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Blocked Tools</FormLabel>
                              <div className="space-y-3">
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Enter tool name to block..."
                                    value={customBlockedTool}
                                    onChange={(e) =>
                                      setCustomBlockedTool(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault()
                                        addCustomTool(
                                          field,
                                          customBlockedTool,
                                          setCustomBlockedTool
                                        )
                                      }
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                      addCustomTool(
                                        field,
                                        customBlockedTool,
                                        setCustomBlockedTool
                                      )
                                    }
                                  >
                                    Add
                                  </Button>
                                </div>
                                {field.value && field.value.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {field.value.map((tool) => (
                                      <Badge
                                        key={tool}
                                        variant="destructive"
                                        className="gap-1"
                                      >
                                        <Ban className="size-3" />
                                        {tool}
                                        <button
                                          type="button"
                                          onClick={() =>
                                            removeTool(field, tool)
                                          }
                                          className="ml-1 hover:text-white"
                                        >
                                          <XCircle className="size-3" />
                                        </button>
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </>
                  )}

                  <FormField
                    control={form.control}
                    name="require_approval_for"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tools Requiring Approval</FormLabel>
                        <FormDescription>
                          These tools will require human approval before
                          execution
                        </FormDescription>
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter tool name..."
                              value={customApprovalTool}
                              onChange={(e) =>
                                setCustomApprovalTool(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  addCustomTool(
                                    field,
                                    customApprovalTool,
                                    setCustomApprovalTool
                                  )
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                addCustomTool(
                                  field,
                                  customApprovalTool,
                                  setCustomApprovalTool
                                )
                              }
                            >
                              Add
                            </Button>
                          </div>
                          {field.value && field.value.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {field.value.map((tool) => (
                                <Badge
                                  key={tool}
                                  variant="outline"
                                  className="gap-1 border-yellow-500 text-yellow-600"
                                >
                                  <Shield className="size-3" />
                                  {tool}
                                  <button
                                    type="button"
                                    onClick={() => removeTool(field, tool)}
                                    className="ml-1 hover:text-destructive"
                                  >
                                    <XCircle className="size-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          <AccordionItem value="limits">
            <Card>
              <CardHeader className="pb-3">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900">
                      <Clock className="size-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="text-left">
                      <CardTitle className="text-base">
                        Rate Limits & Restrictions
                      </CardTitle>
                      <CardDescription>
                        Control how often tools can be used
                      </CardDescription>
                    </div>
                  </div>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent className="space-y-6 pt-4">
                  <div className="grid gap-6 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="rate_limits.calls_per_minute"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Calls per Minute</FormLabel>
                          <FormControl>
                            <InputSpin
                              value={field.value ?? 60}
                              onChange={field.onChange}
                              min={1}
                              max={1000}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rate_limits.calls_per_hour"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Calls per Hour</FormLabel>
                          <FormControl>
                            <InputSpin
                              value={field.value ?? 1000}
                              onChange={field.onChange}
                              min={1}
                              max={10000}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rate_limits.calls_per_day"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Calls per Day</FormLabel>
                          <FormControl>
                            <InputSpin
                              value={field.value ?? 10000}
                              onChange={field.onChange}
                              min={1}
                              max={100000}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Time Restrictions</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="time_restrictions.allowed_hours.start"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Allowed Hours Start</FormLabel>
                            <FormControl>
                              <Input
                                type="time"
                                value={field.value ?? "09:00"}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="time_restrictions.allowed_hours.end"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Allowed Hours End</FormLabel>
                            <FormControl>
                              <Input
                                type="time"
                                value={field.value ?? "18:00"}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="time_restrictions.allowed_days"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Allowed Days</FormLabel>
                          <div className="flex flex-wrap gap-2">
                            {DAYS_OF_WEEK.map((day) => (
                              <div
                                key={day.value}
                                className={cn(
                                  "flex items-center space-x-2 px-3 py-2 border rounded-lg cursor-pointer transition-colors",
                                  field.value?.includes(day.value)
                                    ? "border-primary bg-primary/5"
                                    : "hover:border-primary/50"
                                )}
                                onClick={() => {
                                  if (field.value?.includes(day.value)) {
                                    field.onChange(
                                      field.value.filter((d) => d !== day.value)
                                    )
                                  } else {
                                    field.onChange([
                                      ...(field.value || []),
                                      day.value,
                                    ])
                                  }
                                }}
                              >
                                <Label className="cursor-pointer text-sm">
                                  {day.label.slice(0, 3)}
                                </Label>
                                {field.value?.includes(day.value) && (
                                  <CheckCircle2 className="size-3 text-primary" />
                                )}
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>
        </Accordion>

        <div className="flex justify-end">
          <ButtonLoading
            type="submit"
            isLoading={isSaving}
            disabled={!isDirty}
            icon={Save}
          >
            Save Changes
          </ButtonLoading>
        </div>
      </form>
    </Form>
  )
}
