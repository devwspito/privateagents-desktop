"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Loader2, Radio } from "lucide-react"

import type { Agent, Department } from "@/lib/api"
import type { BroadcastMessageFormType } from "@/schemas/broadcast-message-schema"

import { BroadcastMessageSchema } from "@/schemas/broadcast-message-schema"

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
import { Textarea } from "@/components/ui/textarea"

export interface BroadcastMessageDialogProps {
  enterpriseId: string
  agents: Agent[]
  departments: Department[]
  onSend?: (
    data: BroadcastMessageFormType & { enterprise_id: string }
  ) => Promise<void> | void
  trigger?: React.ReactNode
}

const messageTypes = [
  { value: "notification", label: "Notification" },
  { value: "task", label: "Task" },
  { value: "request", label: "Request" },
  { value: "alert", label: "Alert" },
  { value: "info", label: "Information" },
] as const

const priorities = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
] as const

export function BroadcastMessageDialog({
  enterpriseId,
  agents,
  departments,
  onSend,
  trigger,
}: BroadcastMessageDialogProps) {
  const [open, setOpen] = useState(false)

  const form = useForm<BroadcastMessageFormType>({
    resolver: zodResolver(BroadcastMessageSchema),
    defaultValues: {
      from_agent_id: "",
      department_id: "",
      subject: "",
      body: "",
      message_type: "notification",
      priority: "medium",
    },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(data: BroadcastMessageFormType) {
    try {
      if (onSend) {
        await onSend({ ...data, enterprise_id: enterpriseId })
      }

      const targetDept = departments.find((d) => d.id === data.department_id)
      toast({
        title: "Broadcast sent",
        description: `Message broadcasted to all agents in ${targetDept?.display_name || targetDept?.name || data.department_id}`,
      })

      form.reset()
      setOpen(false)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to send broadcast",
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

  const enabledAgents = agents.filter((a) => a.enabled)
  const enabledDepartments = departments.filter((d) => d.enabled)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Radio className="mr-2 h-4 w-4" />
            Broadcast Message
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Broadcast Message</DialogTitle>
          <DialogDescription>
            Send a message to all agents in a department. This is useful for
            announcements, alerts, or coordinated task assignments.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="from_agent_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From Agent</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sender agent" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {enabledAgents.length === 0 ? (
                        <SelectItem value="_none" disabled>
                          No agents available
                        </SelectItem>
                      ) : (
                        enabledAgents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.display_name || agent.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The agent sending the broadcast message
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="department_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Department</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select target department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {enabledDepartments.length === 0 ? (
                        <SelectItem value="_none" disabled>
                          No departments available
                        </SelectItem>
                      ) : (
                        enabledDepartments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.display_name || dept.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    All agents in this department will receive the message
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Message subject..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your broadcast message..."
                      className="min-h-[120px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="message_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {messageTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {priorities.map((priority) => (
                          <SelectItem
                            key={priority.value}
                            value={priority.value}
                          >
                            {priority.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Send Broadcast
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
