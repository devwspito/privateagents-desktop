"use client"

import { useMemo, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import {
  ArrowLeft,
  Bug,
  CheckCircle2,
  Clock,
  Eye,
  Headset,
  Loader2,
  MessageCircle,
  Search,
  Settings,
  ShieldAlert,
  User,
  Wrench,
  XCircle,
} from "lucide-react"
import { useRouter } from "next/navigation"

import {
  useSupportTickets,
  useSupportTicket,
  useUpdateSupportTicket,
} from "@/lib/api/hooks"

import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  open: {
    label: "Open",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    icon: <Bug className="size-3" />,
  },
  triaging: {
    label: "Triaging",
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    icon: <Search className="size-3" />,
  },
  reproducing: {
    label: "Reproducing",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    icon: <Eye className="size-3" />,
  },
  fixing: {
    label: "Fixing",
    color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    icon: <Wrench className="size-3" />,
  },
  reviewing: {
    label: "Reviewing",
    color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
    icon: <ShieldAlert className="size-3" />,
  },
  resolved: {
    label: "Resolved",
    color: "bg-green-500/10 text-green-600 border-green-500/20",
    icon: <CheckCircle2 className="size-3" />,
  },
  closed: {
    label: "Closed",
    color: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    icon: <XCircle className="size-3" />,
  },
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
  medium: { label: "Medium", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  high: { label: "High", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  critical: { label: "Critical", color: "bg-red-500/10 text-red-600 border-red-500/20" },
}

export default function TicketsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)

  const { data, isLoading } = useSupportTickets({
    status: statusFilter === "all" ? undefined : statusFilter,
  })

  const tickets = data?.items || []

  const statusCounts = useMemo(() => {
    if (!tickets.length) return {}
    const counts: Record<string, number> = {}
    for (const t of tickets) {
      counts[t.status] = (counts[t.status] || 0) + 1
    }
    return counts
  }, [tickets])

  if (isLoading) {
    return (
      <div className="container p-6 flex justify-center items-center h-64">
        <Loader2 className="size-8 animate-spin" />
      </div>
    )
  }

  if (selectedTicketId) {
    return (
      <div className="container p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedTicketId(null)}
          className="mb-4"
        >
          <ArrowLeft className="size-4 mr-1" />
          Back to tickets
        </Button>
        <TicketDetail ticketId={selectedTicketId} />
      </div>
    )
  }

  return (
    <div className="container p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Headset className="size-6" />
            Support Tickets
          </h1>
          <p className="text-muted-foreground">
            Track bug reports and support requests handled by the Support Team
          </p>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        <Badge
          variant={statusFilter === "all" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setStatusFilter("all")}
        >
          All ({data?.total || 0})
        </Badge>
        {Object.entries(STATUS_CONFIG).map(([status, config]) => (
          <Badge
            key={status}
            variant={statusFilter === status ? "default" : "outline"}
            className={`cursor-pointer gap-1 ${statusFilter !== status ? config.color : ""}`}
            onClick={() => setStatusFilter(status)}
          >
            {config.icon}
            {config.label} ({statusCounts[status] || 0})
          </Badge>
        ))}
      </div>

      {/* Tickets list */}
      {tickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Headset className="size-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No tickets</p>
            <p className="text-sm mt-1">
              When errors are reported, tickets will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {tickets.map((ticket) => {
            const statusConf = STATUS_CONFIG[ticket.status] || STATUS_CONFIG["open"]
            const priorityConf = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG["medium"]
            return (
              <Card
                key={ticket.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setSelectedTicketId(ticket.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 min-w-0 flex-1">
                      <CardTitle className="text-base">{ticket.title}</CardTitle>
                      {ticket.description && (
                        <CardDescription className="line-clamp-2">
                          {ticket.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0 ml-3">
                      <Badge variant="outline" className={`gap-1 ${priorityConf!.color}`}>
                        {priorityConf!.label}
                      </Badge>
                      <Badge variant="outline" className={`gap-1 ${statusConf!.color}`}>
                        {statusConf!.icon}
                        {statusConf!.label}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <User className="size-3" />
                      {ticket.created_by_user_id}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                    </span>
                    {ticket.assigned_agent_id && (
                      <span className="flex items-center gap-1">
                        <Settings className="size-3" />
                        {ticket.assigned_agent_id}
                      </span>
                    )}
                  </div>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TicketDetail({ ticketId }: { ticketId: string }) {
  const router = useRouter()
  const { data: ticket, isLoading } = useSupportTicket(ticketId)
  const updateTicket = useUpdateSupportTicket()

  if (isLoading || !ticket) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-8 animate-spin" />
      </div>
    )
  }

  const statusConf = STATUS_CONFIG[ticket.status] || STATUS_CONFIG["open"]
  const priorityConf = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG["medium"]

  const handleClose = () => {
    updateTicket.mutate(
      { ticketId: ticket.id, data: { status: "closed" } },
      {
        onSuccess: () => {
          toast({ title: "Ticket closed" })
        },
        onError: (err) => {
          toast({ variant: "destructive", title: "Error", description: err.message })
        },
      }
    )
  }

  const handleOpenChat = () => {
    if (ticket.conversation_id) {
      router.push(`/en/apps/chat?conversation=${ticket.conversation_id}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold">{ticket.title}</h2>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <Badge variant="outline" className={`gap-1 ${statusConf!.color}`}>
              {statusConf!.icon}
              {statusConf!.label}
            </Badge>
            <Badge variant="outline" className={`gap-1 ${priorityConf!.color}`}>
              {priorityConf!.label}
            </Badge>
            <span className="font-mono text-xs">{ticket.id}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {ticket.conversation_id && (
            <Button size="sm" variant="outline" onClick={handleOpenChat}>
              <MessageCircle className="size-4 mr-1" />
              Open Chat
            </Button>
          )}
          {!["closed", "resolved"].includes(ticket.status) && (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleClose}
              disabled={updateTicket.isPending}
            >
              <XCircle className="size-4 mr-1" />
              Close
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Description */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">
              {ticket.description || "No description provided"}
            </p>
          </CardContent>
        </Card>

        {/* Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ticket Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reporter</span>
              <span>{ticket.created_by_user_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Assigned To</span>
              <span>{ticket.assigned_agent_id || "Unassigned"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Priority</span>
              <Badge variant="outline" className={`gap-1 ${priorityConf!.color}`}>
                {priorityConf!.label}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="outline" className={`gap-1 ${statusConf!.color}`}>
                {statusConf!.icon}
                {statusConf!.label}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{new Date(ticket.created_at).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Updated</span>
              <span>{new Date(ticket.updated_at).toLocaleString()}</span>
            </div>
            {ticket.resolved_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Resolved</span>
                <span>{new Date(ticket.resolved_at).toLocaleString()}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Data */}
        {ticket.error_data && Object.keys(ticket.error_data).length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm">Error Details</CardTitle>
              <CardDescription>
                Captured automatically from the application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-60">
                {JSON.stringify(ticket.error_data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Resolution */}
        {ticket.resolution && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm">Resolution</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{ticket.resolution}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
