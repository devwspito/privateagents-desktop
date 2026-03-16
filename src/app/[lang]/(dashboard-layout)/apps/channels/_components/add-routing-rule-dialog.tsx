"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Loader2, Plus, Route } from "lucide-react"

import type { RoutingRule } from "@/lib/api"
import type {
  ChannelType,
  RoutingRuleFormType,
} from "@/schemas/routing-rule-schema"

import {
  CHANNEL_OPTIONS,
  CHANNEL_VALUES,
  RoutingRuleSchema,
} from "@/schemas/routing-rule-schema"

import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Agent {
  id: string
  name?: string
}

function getChannelValue(channel: string | undefined): ChannelType {
  if (channel && CHANNEL_VALUES.includes(channel as ChannelType)) {
    return channel as ChannelType
  }
  return "webchat"
}

interface AddRoutingRuleDialogProps {
  rule?: RoutingRule | null
  agents: Agent[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSave: (rule: Partial<RoutingRule>) => Promise<void>
  isLoading?: boolean
  trigger?: React.ReactNode
}

export function AddRoutingRuleDialog({
  rule,
  agents,
  open: controlledOpen,
  onOpenChange,
  onSave,
  isLoading = false,
  trigger,
}: AddRoutingRuleDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  const isEditing = !!rule

  const form = useForm<RoutingRuleFormType>({
    resolver: zodResolver(RoutingRuleSchema),
    defaultValues: {
      channel: getChannelValue(rule?.channel),
      pattern: rule?.pattern || "",
      keywords: rule?.keywords?.join(", ") || "",
      agent_id: rule?.agent_id || "",
      department_id: rule?.department_id || "",
      priority: rule?.priority ?? 0,
    },
  })

  const { isSubmitting } = form.formState

  useEffect(() => {
    if (open) {
      form.reset({
        channel: getChannelValue(rule?.channel),
        pattern: rule?.pattern || "",
        keywords: rule?.keywords?.join(", ") || "",
        agent_id: rule?.agent_id || "",
        department_id: rule?.department_id || "",
        priority: rule?.priority ?? 0,
      })
    }
  }, [open, rule, form])

  async function onSubmit(data: RoutingRuleFormType) {
    try {
      const keywordsArray = data.keywords
        ? data.keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean)
        : null

      await onSave({
        id: rule?.id,
        channel: data.channel,
        pattern: data.pattern || null,
        keywords: keywordsArray,
        agent_id: data.agent_id,
        department_id: data.department_id || null,
        priority: data.priority,
      })

      toast({
        title: isEditing ? "Rule updated" : "Rule created",
        description: isEditing
          ? "The routing rule has been updated successfully."
          : "The routing rule has been created successfully.",
      })

      form.reset()
      setOpen(false)
    } catch (error) {
      toast({
        variant: "destructive",
        title: isEditing ? "Failed to update rule" : "Failed to create rule",
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen)
    if (!newOpen) {
      form.reset()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger !== undefined ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button>
            {isEditing ? (
              <Route className="mr-2 h-4 w-4" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {isEditing ? "Edit Rule" : "Add Rule"}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Routing Rule" : "Add Routing Rule"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modify the routing rule configuration below."
              : "Configure a new routing rule to direct messages to the appropriate agent."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="channel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Channel</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a channel" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CHANNEL_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pattern"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pattern (regex)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., ^support.*" {...field} />
                  </FormControl>
                  <FormDescription>
                    Optional regex pattern to match message content
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keywords</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., help, support, urgent"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Comma-separated keywords to match in messages
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="agent_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Route to Agent</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an agent" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name || agent.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value
                        field.onChange(value === "" ? 0 : parseInt(value, 10))
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Higher priority rules are evaluated first (0-100)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading || isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || isSubmitting || !form.watch("agent_id")}
              >
                {(isLoading || isSubmitting) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? "Save Changes" : "Create Rule"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
