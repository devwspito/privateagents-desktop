"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  AlertTriangle,
  Bell,
  BellOff,
  Clock,
  DollarSign,
  Loader2,
  Save,
  Shield,
  ShieldCheck,
  ShieldQuestion,
  Sunrise,
  User as UserIcon,
  Users,
} from "lucide-react"

import type {
  Department,
  DepartmentHumanLoopConfig,
  User,
} from "@/lib/api/client"

import {
  useDepartmentHumanLoopConfig,
  useUpdateDepartmentHumanLoopConfig,
  useUsers,
} from "@/lib/api"
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
import { Checkbox } from "@/components/ui/checkbox"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { ThresholdSlider } from "@/components/ui/threshold-slider"

const DepartmentAutonomySchema = z.object({
  auto_approve_up_to: z.number().optional(),
  require_approval_above: z.number().optional(),
  actions_requiring_approval: z.array(z.string()).optional(),
  actions_auto_approved: z.array(z.string()).optional(),
  low_confidence_threshold: z.number().min(0).max(1),
  approval_chain: z.array(z.string()).optional(),
  fallback_approver_id: z.string().optional(),
  sla_response_minutes: z.number().min(1),
  auto_escalate_after_minutes: z.number().min(1),
  auto_reject_after_minutes: z.number().optional(),
  working_hours: z.record(z.string()),
  pause_outside_hours: z.boolean(),
  emergency_contact_id: z.string().optional(),
  notify_on_escalation: z.array(z.string()).optional(),
  notify_supervisor_on_rejection: z.boolean(),
  daily_summary_enabled: z.boolean(),
})

type DepartmentAutonomyFormType = z.infer<typeof DepartmentAutonomySchema>

const ACTION_TYPES = [
  {
    value: "payment",
    label: "Payments",
    description: "Financial transactions",
  },
  { value: "contract", label: "Contracts", description: "Legal agreements" },
  { value: "hiring", label: "Hiring", description: "Recruitment decisions" },
  {
    value: "communication",
    label: "Communication",
    description: "External messages",
  },
  {
    value: "data_access",
    label: "Data Access",
    description: "Sensitive data operations",
  },
  {
    value: "system_config",
    label: "System Config",
    description: "Configuration changes",
  },
  { value: "report", label: "Reports", description: "Report generation" },
  {
    value: "scheduling",
    label: "Scheduling",
    description: "Calendar and scheduling",
  },
] as const

const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const

const DEFAULT_WORKING_HOURS: Record<string, string> = {
  monday: "09:00-17:00",
  tuesday: "09:00-17:00",
  wednesday: "09:00-17:00",
  thursday: "09:00-17:00",
  friday: "09:00-17:00",
  saturday: "closed",
  sunday: "closed",
}

interface DepartmentAutonomyConfigProps {
  department: Department
  onUpdate?: (config: DepartmentHumanLoopConfig) => void
}

export function DepartmentAutonomyConfig({
  department,
  onUpdate,
}: DepartmentAutonomyConfigProps) {
  const [isSaving, setIsSaving] = useState(false)

  const {
    data: configData,
    isLoading,
    error,
  } = useDepartmentHumanLoopConfig(department.id)
  const { data: usersData } = useUsers({
    enterprise_id: department.enterprise_id,
  })
  const updateConfig = useUpdateDepartmentHumanLoopConfig()

  const users = usersData?.items || []

  const form = useForm<DepartmentAutonomyFormType>({
    resolver: zodResolver(DepartmentAutonomySchema),
    values: configData
      ? (() => {
          const d = configData as unknown as Record<string, unknown>
          return {
            auto_approve_up_to: (d["auto_approve_up_to"] as number) ?? 100,
            require_approval_above: (d["require_approval_above"] as number) ?? 1000,
            actions_requiring_approval:
              (d["actions_requiring_approval"] as string[]) ?? [],
            actions_auto_approved: (d["actions_auto_approved"] as string[]) ?? [],
            low_confidence_threshold: (d["low_confidence_threshold"] as number) ?? 0.7,
            approval_chain: (d["approval_chain"] as string[]) ?? [],
            fallback_approver_id: (d["fallback_approver_id"] as string) ?? "",
            sla_response_minutes: (d["sla_response_minutes"] as number) ?? 60,
            auto_escalate_after_minutes:
              (d["auto_escalate_after_minutes"] as number) ?? 120,
            auto_reject_after_minutes:
              (d["auto_reject_after_minutes"] as number) ?? 1440,
            working_hours: (d["working_hours"] as Record<string, string>) ?? DEFAULT_WORKING_HOURS,
            pause_outside_hours: (d["pause_outside_hours"] as boolean) ?? true,
            emergency_contact_id: (d["emergency_contact_id"] as string) ?? "",
            notify_on_escalation: (d["notify_on_escalation"] as string[]) ?? [],
            notify_supervisor_on_rejection:
              (d["notify_supervisor_on_rejection"] as boolean) ?? true,
            daily_summary_enabled: (d["daily_summary_enabled"] as boolean) ?? false,
          }
        })()
      : undefined,
  })

  const { isDirty } = form.formState

  async function onSubmit(data: DepartmentAutonomyFormType) {
    setIsSaving(true)
    try {
      const result = await updateConfig.mutateAsync({
        departmentId: department.id,
        data: {
          auto_approve_up_to: data.auto_approve_up_to,
          require_approval_above: data.require_approval_above,
          actions_requiring_approval: data.actions_requiring_approval,
          actions_auto_approved: data.actions_auto_approved,
          low_confidence_threshold: data.low_confidence_threshold,
          approval_chain: data.approval_chain,
          fallback_approver_id: data.fallback_approver_id || undefined,
          sla_response_minutes: data.sla_response_minutes,
          auto_escalate_after_minutes: data.auto_escalate_after_minutes,
          auto_reject_after_minutes: data.auto_reject_after_minutes,
          working_hours: data.working_hours,
          pause_outside_hours: data.pause_outside_hours,
          emergency_contact_id: data.emergency_contact_id || undefined,
          notify_on_escalation: data.notify_on_escalation,
          notify_supervisor_on_rejection: data.notify_supervisor_on_rejection,
          daily_summary_enabled: data.daily_summary_enabled,
        } as Partial<DepartmentHumanLoopConfig>,
      })

      toast({
        title: "Configuration saved",
        description: "Department autonomy settings have been updated.",
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
          <p className="text-muted-foreground">Failed to load configuration</p>
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
              <ShieldCheck className="size-5 text-primary" />
              Autonomy Configuration
            </h3>
            <p className="text-sm text-muted-foreground">
              Configure how agents in{" "}
              {department.display_name || department.name} operate autonomously
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

        <Accordion
          type="multiple"
          defaultValue={["thresholds", "actions"]}
          className="space-y-4"
        >
          <AccordionItem value="thresholds">
            <Card>
              <CardHeader className="pb-3">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                      <DollarSign className="size-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-left">
                      <CardTitle className="text-base">
                        Approval Thresholds
                      </CardTitle>
                      <CardDescription>
                        Define monetary limits for automatic approvals
                      </CardDescription>
                    </div>
                  </div>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent className="space-y-6 pt-4">
                  <FormField
                    control={form.control}
                    name="auto_approve_up_to"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Auto-Approve Up To</FormLabel>
                        <FormControl>
                          <ThresholdSlider
                            value={field.value}
                            onChange={field.onChange}
                            min={0}
                            max={10000}
                            step={50}
                            formatValue={(v) =>
                              new Intl.NumberFormat("en", {
                                style: "currency",
                                currency: "USD",
                                maximumFractionDigits: 0,
                              }).format(v)
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Requests below this amount are automatically approved
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="require_approval_above"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Require Approval Above</FormLabel>
                        <FormControl>
                          <ThresholdSlider
                            value={field.value}
                            onChange={field.onChange}
                            min={0}
                            max={50000}
                            step={100}
                            formatValue={(v) =>
                              new Intl.NumberFormat("en", {
                                style: "currency",
                                currency: "USD",
                                maximumFractionDigits: 0,
                              }).format(v)
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Requests above this amount require manager approval
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          <AccordionItem value="actions">
            <Card>
              <CardHeader className="pb-3">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                      <Shield className="size-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-left">
                      <CardTitle className="text-base">
                        Action Categories
                      </CardTitle>
                      <CardDescription>
                        Configure which actions require approval
                      </CardDescription>
                    </div>
                  </div>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent className="space-y-6 pt-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-3">
                        Actions Requiring Approval
                      </h4>
                      <FormField
                        control={form.control}
                        name="actions_requiring_approval"
                        render={({ field }) => (
                          <FormItem>
                            <div className="grid grid-cols-2 gap-3">
                              {ACTION_TYPES.map((action) => (
                                <div
                                  key={action.value}
                                  className="flex items-start space-x-3 p-3 border rounded-lg"
                                >
                                  <Checkbox
                                    id={`approval-${action.value}`}
                                    checked={field.value?.includes(
                                      action.value
                                    )}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        field.onChange([
                                          ...(field.value || []),
                                          action.value,
                                        ])
                                      } else {
                                        field.onChange(
                                          field.value?.filter(
                                            (v) => v !== action.value
                                          )
                                        )
                                      }
                                    }}
                                  />
                                  <div className="flex-1">
                                    <Label
                                      htmlFor={`approval-${action.value}`}
                                      className="cursor-pointer font-medium"
                                    >
                                      {action.label}
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                      {action.description}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-sm font-medium mb-3">
                        Auto-Approved Actions
                      </h4>
                      <FormField
                        control={form.control}
                        name="actions_auto_approved"
                        render={({ field }) => (
                          <FormItem>
                            <div className="grid grid-cols-2 gap-3">
                              {ACTION_TYPES.map((action) => (
                                <div
                                  key={action.value}
                                  className="flex items-start space-x-3 p-3 border rounded-lg"
                                >
                                  <Checkbox
                                    id={`auto-${action.value}`}
                                    checked={field.value?.includes(
                                      action.value
                                    )}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        field.onChange([
                                          ...(field.value || []),
                                          action.value,
                                        ])
                                      } else {
                                        field.onChange(
                                          field.value?.filter(
                                            (v) => v !== action.value
                                          )
                                        )
                                      }
                                    }}
                                  />
                                  <div className="flex-1">
                                    <Label
                                      htmlFor={`auto-${action.value}`}
                                      className="cursor-pointer font-medium"
                                    >
                                      {action.label}
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                      {action.description}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          <AccordionItem value="confidence">
            <Card>
              <CardHeader className="pb-3">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900">
                      <ShieldQuestion className="size-4 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="text-left">
                      <CardTitle className="text-base">
                        Confidence Settings
                      </CardTitle>
                      <CardDescription>
                        AI confidence thresholds for autonomous decisions
                      </CardDescription>
                    </div>
                  </div>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent className="space-y-6 pt-4">
                  <FormField
                    control={form.control}
                    name="low_confidence_threshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Low Confidence Threshold</FormLabel>
                        <FormControl>
                          <div className="space-y-4">
                            <ThresholdSlider
                              value={field.value * 100}
                              onChange={(v) => field.onChange(v / 100)}
                              min={0}
                              max={100}
                              step={5}
                              formatValue={(v) => `${v}%`}
                            />
                            <div className="flex items-center gap-4 text-sm">
                              <Badge
                                variant="outline"
                                className={cn(
                                  field.value < 0.5
                                    ? "border-red-500 text-red-600"
                                    : field.value < 0.7
                                      ? "border-yellow-500 text-yellow-600"
                                      : "border-green-500 text-green-600"
                                )}
                              >
                                {field.value < 0.5
                                  ? "Permissive"
                                  : field.value < 0.7
                                    ? "Balanced"
                                    : "Conservative"}
                              </Badge>
                              <span className="text-muted-foreground">
                                Actions with confidence below{" "}
                                {Math.round(field.value * 100)}% will require
                                approval
                              </span>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          <AccordionItem value="sla">
            <Card>
              <CardHeader className="pb-3">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                      <Clock className="size-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-left">
                      <CardTitle className="text-base">
                        SLA & Escalation
                      </CardTitle>
                      <CardDescription>
                        Response times and escalation rules
                      </CardDescription>
                    </div>
                  </div>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent className="space-y-6 pt-4">
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="sla_response_minutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SLA Response Time (minutes)</FormLabel>
                          <FormControl>
                            <InputSpin
                              value={field.value}
                              onChange={field.onChange}
                              min={1}
                              max={1440}
                            />
                          </FormControl>
                          <FormDescription>
                            Expected time to respond to approval requests
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="auto_escalate_after_minutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Auto-Escalate After (minutes)</FormLabel>
                          <FormControl>
                            <InputSpin
                              value={field.value}
                              onChange={field.onChange}
                              min={1}
                              max={2880}
                            />
                          </FormControl>
                          <FormDescription>
                            Time before escalating to next approver
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="auto_reject_after_minutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Auto-Reject After (minutes)</FormLabel>
                          <FormControl>
                            <InputSpin
                              value={field.value ?? 1440}
                              onChange={field.onChange}
                              min={60}
                              max={10080}
                            />
                          </FormControl>
                          <FormDescription>
                            Time before automatically rejecting stale requests
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          <AccordionItem value="working-hours">
            <Card>
              <CardHeader className="pb-3">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900">
                      <Sunrise className="size-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="text-left">
                      <CardTitle className="text-base">Working Hours</CardTitle>
                      <CardDescription>
                        Define when approvals are processed
                      </CardDescription>
                    </div>
                  </div>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent className="space-y-6 pt-4">
                  <FormField
                    control={form.control}
                    name="pause_outside_hours"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Pause Outside Hours
                          </FormLabel>
                          <FormDescription>
                            Do not send approval requests outside working hours
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

                  <div className="space-y-3">
                    <Label>Working Hours Schedule</Label>
                    <div className="grid gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <FormField
                          key={day}
                          control={form.control}
                          name="working_hours"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center gap-3">
                                <div className="w-24 text-sm font-medium capitalize">
                                  {day}
                                </div>
                                <FormControl>
                                  <Input
                                    value={field.value?.[day] || ""}
                                    onChange={(e) =>
                                      field.onChange({
                                        ...field.value,
                                        [day]: e.target.value,
                                      })
                                    }
                                    placeholder="09:00-17:00 or closed"
                                    className="flex-1"
                                  />
                                </FormControl>
                              </div>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          <AccordionItem value="notifications">
            <Card>
              <CardHeader className="pb-3">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-900">
                      <Bell className="size-4 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div className="text-left">
                      <CardTitle className="text-base">Notifications</CardTitle>
                      <CardDescription>
                        Configure notification preferences
                      </CardDescription>
                    </div>
                  </div>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent className="space-y-6 pt-4">
                  <FormField
                    control={form.control}
                    name="notify_supervisor_on_rejection"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base flex items-center gap-2">
                            <Bell className="size-4" />
                            Notify on Rejection
                          </FormLabel>
                          <FormDescription>
                            Notify supervisors when requests are rejected
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

                  <FormField
                    control={form.control}
                    name="daily_summary_enabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base flex items-center gap-2">
                            <BellOff className="size-4" />
                            Daily Summary
                          </FormLabel>
                          <FormDescription>
                            Send daily summary of approval activity
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

                  <FormField
                    control={form.control}
                    name="notify_on_escalation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notify on Escalation</FormLabel>
                        <FormDescription>
                          Select users to notify when requests are escalated
                        </FormDescription>
                        <FormControl>
                          <ScrollArea className="h-40 rounded-md border p-3">
                            <div className="space-y-2">
                              {users.map((user: User) => (
                                <div
                                  key={user.id}
                                  className="flex items-center space-x-3 py-1"
                                >
                                  <Checkbox
                                    id={`notify-${user.id}`}
                                    checked={field.value?.includes(user.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        field.onChange([
                                          ...(field.value || []),
                                          user.id,
                                        ])
                                      } else {
                                        field.onChange(
                                          field.value?.filter(
                                            (id) => id !== user.id
                                          )
                                        )
                                      }
                                    }}
                                  />
                                  <Label
                                    htmlFor={`notify-${user.id}`}
                                    className="cursor-pointer text-sm"
                                  >
                                    {user.name || user.email}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          <AccordionItem value="approvers">
            <Card>
              <CardHeader className="pb-3">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900">
                      <Users className="size-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="text-left">
                      <CardTitle className="text-base">
                        Approval Chain
                      </CardTitle>
                      <CardDescription>
                        Define the approval hierarchy
                      </CardDescription>
                    </div>
                  </div>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent className="space-y-6 pt-4">
                  <FormField
                    control={form.control}
                    name="fallback_approver_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <UserIcon className="size-4" />
                          Fallback Approver
                        </FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select fallback approver" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {users.map((user: User) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name || user.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Person to contact when no approver is available
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emergency_contact_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <AlertTriangle className="size-4" />
                          Emergency Contact
                        </FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select emergency contact" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {users.map((user: User) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name || user.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Contact for urgent approval requests
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="approval_chain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Approval Chain</FormLabel>
                        <FormDescription>
                          Ordered list of approvers (first available will be
                          contacted)
                        </FormDescription>
                        <FormControl>
                          <ScrollArea className="h-48 rounded-md border p-3">
                            <div className="space-y-2">
                              {users.map((user: User) => (
                                <div
                                  key={user.id}
                                  className="flex items-center justify-between space-x-3 py-1 border-b last:border-0"
                                >
                                  <div className="flex items-center gap-3">
                                    <Checkbox
                                      id={`chain-${user.id}`}
                                      checked={field.value?.includes(user.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          field.onChange([
                                            ...(field.value || []),
                                            user.id,
                                          ])
                                        } else {
                                          field.onChange(
                                            field.value?.filter(
                                              (id) => id !== user.id
                                            )
                                          )
                                        }
                                      }}
                                    />
                                    <Label
                                      htmlFor={`chain-${user.id}`}
                                      className="cursor-pointer text-sm"
                                    >
                                      {user.name || user.email}
                                    </Label>
                                  </div>
                                  {field.value?.includes(user.id) && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      Level {field.value.indexOf(user.id) + 1}
                                    </Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
