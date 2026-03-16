"use client"

import { useMemo, useState } from "react"
import { useSession } from "@/providers/auth-provider"
import { FileText, Loader2 } from "lucide-react"

import { useAuditEntries } from "@/lib/api/hooks"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const RESOURCE_TYPES = [
  "agent",
  "workflow_template",
  "workflow_run",
  "api_key",
  "department",
  "user",
  "kb_collection",
  "kb_document",
  "communication_rule",
  "datalab_project",
  "mcp_deployment",
  "custom_tool",
]

const ACTION_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  created: "default",
  updated: "secondary",
  deleted: "destructive",
  ingested: "default",
  built: "default",
  generated: "secondary",
  deployed: "default",
  stopped: "destructive",
  bound: "secondary",
}

function getActionVariant(action: string) {
  const verb = action.split(".").pop() || ""
  return ACTION_COLORS[verb] || "outline"
}

function formatDate(iso: string | null) {
  if (!iso) return "-"
  return new Date(iso).toLocaleString()
}

export default function AuditLogPage() {
  const { data: session } = useSession()
  const enterpriseId = session?.user?.enterprise_id ?? ""

  const [actionFilter, setActionFilter] = useState<string>("all")
  const [resourceFilter, setResourceFilter] = useState<string>("all")
  const [searchId, setSearchId] = useState("")
  const [page, setPage] = useState(0)
  const limit = 30

  const { data, isLoading } = useAuditEntries({
    enterprise_id: enterpriseId,
    action: actionFilter === "all" ? undefined : actionFilter,
    resource_type: resourceFilter === "all" ? undefined : resourceFilter,
    resource_id: searchId || undefined,
    limit,
    offset: page * limit,
  })

  const entries = data?.entries ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / limit)

  // Collect unique actions from current data for filter options
  const uniqueActions = useMemo(() => {
    const actions = new Set(entries.map((e) => e.action))
    return Array.from(actions).sort()
  }, [entries])

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Audit Log
        </CardTitle>
        <CardDescription>
          Track changes to agents, workflows, and other resources.
        </CardDescription>
      </CardHeader>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={resourceFilter} onValueChange={(v) => { setResourceFilter(v); setPage(0) }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Resource type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All resources</SelectItem>
            {RESOURCE_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(0) }}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {uniqueActions.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          className="w-56"
          placeholder="Resource ID..."
          value={searchId}
          onChange={(e) => { setSearchId(e.target.value); setPage(0) }}
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : entries.length === 0 ? (
        <Card>
          <CardHeader className="text-center">
            <CardDescription>No audit entries found.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Resource ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Changes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Badge variant={getActionVariant(entry.action)}>
                        {entry.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {entry.resource_type}
                    </TableCell>
                    <TableCell className="text-xs font-mono max-w-[160px] truncate">
                      {entry.resource_id || "-"}
                    </TableCell>
                    <TableCell className="text-xs font-mono max-w-[120px] truncate">
                      {entry.user_id || "system"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(entry.created_at)}
                    </TableCell>
                    <TableCell className="text-xs max-w-[200px]">
                      {entry.changes ? (
                        <span className="font-mono truncate block">
                          {Object.keys(entry.changes).join(", ")}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {total} entries total
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
