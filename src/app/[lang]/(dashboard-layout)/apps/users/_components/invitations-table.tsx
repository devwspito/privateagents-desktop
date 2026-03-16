"use client"

import { Check, Clock, Loader2, Mail, Trash2, X } from "lucide-react"

import type { InvitationListItem } from "@/lib/api"

import { useInvitations, useRevokeInvitation } from "@/lib/api/hooks"

import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const statusConfig: Record<
  string,
  {
    label: string
    variant: "default" | "secondary" | "destructive" | "outline"
  }
> = {
  pending: { label: "Pending", variant: "outline" },
  accepted: { label: "Accepted", variant: "default" },
  expired: { label: "Expired", variant: "secondary" },
}

export function InvitationsTable() {
  const { data, isLoading } = useInvitations()
  const revokeMutation = useRevokeInvitation()

  const invitations = (data?.items as InvitationListItem[]) || []

  const handleRevoke = async (invitation: InvitationListItem) => {
    try {
      await revokeMutation.mutateAsync(invitation.id)
      toast({
        title: "Invitation revoked",
        description: `Invitation for ${invitation.email} has been revoked.`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to revoke",
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (invitations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Mail className="size-10 mb-3 opacity-50" />
          <p className="text-lg font-medium">No invitations yet</p>
          <p className="text-sm">
            Use the &quot;Invite User&quot; button to send invitation links.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.map((inv: InvitationListItem) => {
              const status = statusConfig[inv.status] ?? statusConfig["pending"]
              return (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {inv.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={status?.variant ?? "outline"}>
                      {inv.status === "pending" && (
                        <Clock className="size-3 mr-1" />
                      )}
                      {inv.status === "accepted" && (
                        <Check className="size-3 mr-1" />
                      )}
                      {inv.status === "expired" && (
                        <X className="size-3 mr-1" />
                      )}
                      {status?.label ?? inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(inv.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(inv.expires_at ?? "").toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {inv.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevoke(inv)}
                        disabled={revokeMutation.isPending}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-4 mr-1" />
                        Revoke
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
