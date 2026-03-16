"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Calendar, Clock, Plus, Shield, Trash2, User } from "lucide-react"

import type { User as UserType } from "@/lib/api"
import type { DelegationScope, DelegationStatus } from "@/lib/api/client"

import {
  useCreateDelegation,
  useDelegations,
  useRevokeDelegation,
  useUsers,
} from "@/lib/api"
import { cn, getInitials } from "@/lib/utils"

import { toast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button, ButtonLoading } from "@/components/ui/button"
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

interface UserDelegation {
  id: string
  delegator_id?: string
  delegator_name?: string
  delegate_id?: string
  delegate_name?: string
  scope: DelegationScope
  status: DelegationStatus
  expires_at?: string
  created_at?: string
}

const CreateDelegationSchema = z.object({
  delegate_id: z.string().min(1, "Please select a delegate"),
  scope: z.enum(["full", "approvals", "tasks", "communications"], {
    required_error: "Please select a scope",
  }),
  expires_at: z.string().optional(),
})

type CreateDelegationFormType = z.infer<typeof CreateDelegationSchema>

const scopeLabels: Record<string, string> = {
  full: "Full Access",
  approvals: "Approvals Only",
  tasks: "Tasks Only",
  communications: "Communications Only",
  all: "All",
}

const scopeDescriptions: Record<string, string> = {
  full: "Can act on your behalf for all actions",
  approvals: "Can approve/reject requests on your behalf",
  tasks: "Can manage and assign tasks on your behalf",
  communications: "Can send messages on your behalf",
  all: "Can act on your behalf for all actions",
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  expired: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  revoked: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
}

interface DelegationSectionProps {
  user: UserType
  users?: UserType[]
}

export function DelegationSection({
  user,
  users: propUsers,
}: DelegationSectionProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [revokeId, setRevokeId] = useState<string | null>(null)

  const { data: delegationsData } = useDelegations({
    user_id: user.id,
    as_delegator: true,
  })
  const { data: usersData } = useUsers({ enterprise_id: user.enterprise_id })

  const createDelegation = useCreateDelegation()
  const revokeDelegation = useRevokeDelegation()

  const users = propUsers || usersData?.items || []
  const delegations: UserDelegation[] = (delegationsData as unknown as Record<string, unknown>)?.["items"] as UserDelegation[] ?? (delegationsData?.delegations as unknown as UserDelegation[]) ?? []
  const activeDelegations = delegations.filter(
    (d: UserDelegation) => d.status === "active"
  )
  const otherUsers = users.filter((u: UserType) => u.id !== user.id)

  const form = useForm<CreateDelegationFormType>({
    resolver: zodResolver(CreateDelegationSchema),
    defaultValues: {
      delegate_id: "",
      scope: "approvals",
      expires_at: "",
    },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(data: CreateDelegationFormType) {
    try {
      await createDelegation.mutateAsync({
        delegate_id: data.delegate_id,
        scope: data.scope,
        expires_at: data.expires_at || undefined,
      } as unknown as Parameters<typeof createDelegation.mutateAsync>[0])

      toast({
        title: "Delegation created",
        description: "The delegation has been set up successfully.",
      })

      setIsCreateDialogOpen(false)
      form.reset()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to create delegation",
        description:
          error instanceof Error ? error.message : "An error occurred",
      })
    }
  }

  async function handleRevoke(id: string) {
    try {
      setRevokeId(id)
      await revokeDelegation.mutateAsync(id)

      toast({
        title: "Delegation revoked",
        description: "The delegation has been revoked successfully.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to revoke delegation",
        description:
          error instanceof Error ? error.message : "An error occurred",
      })
    } finally {
      setRevokeId(null)
    }
  }

  function formatExpiresAt(dateStr?: string): string {
    if (!dateStr) return "No expiration"
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return "Expired"
    if (diffDays === 0) return "Expires today"
    if (diffDays === 1) return "Expires tomorrow"
    if (diffDays < 7) return `Expires in ${diffDays} days`
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="size-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">Delegations</h4>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="size-4 mr-1" />
              Add Delegate
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Delegation</DialogTitle>
              <DialogDescription>
                Allow another user to act on your behalf for specific actions.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="delegate_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delegate</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a user" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {otherUsers.map((u: UserType) => (
                            <SelectItem key={u.id} value={u.id}>
                              <div className="flex items-center gap-2">
                                <span>{u.name || u.email}</span>
                                {u.role && (
                                  <span className="text-xs text-muted-foreground">
                                    ({u.role})
                                  </span>
                                )}
                              </div>
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
                  name="scope"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Access Scope</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select scope" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(Object.keys(scopeLabels) as DelegationScope[]).map(
                            (scope) => (
                              <SelectItem key={scope} value={scope}>
                                <div>
                                  <div className="font-medium">
                                    {scopeLabels[scope]}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {scopeDescriptions[scope]}
                                  </div>
                                </div>
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expires_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="size-4" />
                        Expiration (optional)
                      </FormLabel>
                      <FormControl>
                        <input
                          type="datetime-local"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <ButtonLoading type="submit" isLoading={isSubmitting}>
                    Create Delegation
                  </ButtonLoading>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {activeDelegations.length === 0 ? (
        <div className="text-sm text-muted-foreground py-4 text-center border rounded-lg bg-muted/30">
          <User className="size-8 mx-auto mb-2 opacity-50" />
          <p>No active delegations</p>
          <p className="text-xs">
            Add a delegate to allow them to act on your behalf
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {activeDelegations.map((delegation: UserDelegation) => (
            <div
              key={delegation.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Avatar className="size-8">
                  <AvatarImage
                    src={undefined}
                    alt={delegation.delegate_name || "Delegate"}
                  />
                  <AvatarFallback className="text-xs">
                    {getInitials(delegation.delegate_name || "U")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {delegation.delegate_name || "Unknown User"}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge
                      variant="secondary"
                      className={cn("text-xs", statusColors[delegation.status])}
                    >
                      {scopeLabels[delegation.scope]}
                    </Badge>
                    {delegation.expires_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {formatExpiresAt(delegation.expires_at)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => handleRevoke(delegation.id)}
                disabled={revokeId === delegation.id}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {delegations.filter((d: UserDelegation) => d.status !== "active").length >
        0 && (
        <>
          <Separator />
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Inactive Delegations
            </p>
            <div className="space-y-2">
              {delegations
                .filter((d: UserDelegation) => d.status !== "active")
                .map((delegation: UserDelegation) => (
                  <div
                    key={delegation.id}
                    className="flex items-center justify-between p-2 border rounded-lg opacity-60"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {delegation.delegate_name || "Unknown"}
                      </span>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          statusColors[delegation.status]
                        )}
                      >
                        {delegation.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {scopeLabels[delegation.scope]}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
