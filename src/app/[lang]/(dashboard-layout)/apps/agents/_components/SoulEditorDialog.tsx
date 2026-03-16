"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import {
  Check,
  Code,
  Columns,
  Copy,
  Download,
  ExternalLink,
  Eye,
  Loader2,
  RefreshCw,
  Save,
  Sparkles,
  X,
} from "lucide-react"

import type { Agent } from "@/lib/api"

import { api } from "@/lib/api"

import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  SOUL_CONNECTORS,
  getAllConnectors,
} from "../_constants/soul-connectors"
import { SimpleMarkdownPreview } from "./SimpleMarkdownPreview"

export function SoulEditorDialog({
  open,
  onOpenChange,
  agent,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  agent: Agent
}) {
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [content, setContent] = useState("")
  const [viewMode, setViewMode] = useState<"split" | "editor" | "preview">(
    "split"
  )
  const [showConnectors, setShowConnectors] = useState(false)
  const [connectingSource, setConnectingSource] = useState<string | null>(null)
  const [sourceUrl, setSourceUrl] = useState("")

  const { data: soul, isLoading } = useQuery({
    queryKey: ["agents", agent.id, "soul"],
    queryFn: () => api.getAgentSoul(agent.id),
    enabled: open,
  })

  useEffect(() => {
    if (soul?.cached_content) {
      setContent(soul.cached_content)
    } else {
      setContent(`# ${agent.display_name || agent.name} - SOUL Template

## Identity

You are ${agent.display_name || agent.name}, an AI agent for {{COMPANY_NAME}}.

## Role

${agent.description || "Describe your role here..."}

## Capabilities

### What you CAN do:
- List your capabilities here
-

### What you CANNOT do:
- List your limitations here
-

## Personality

- Professional and helpful
- Clear and concise
-

## Examples

### Example Task
User: "Example request"
Action:
1. Step 1
2. Step 2
3. Respond with result
`)
    }
  }, [soul, agent])

  const stats = useMemo(() => {
    const chars = content.length
    const words = content.trim().split(/\s+/).filter(Boolean).length
    const lines = content.split("\n").length
    return { chars, words, lines }
  }, [content])

  const updateMutation = useMutation({
    mutationFn: (data: { cached_content: string }) =>
      api.updateAgentSoul(agent.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents", agent.id, "soul"] })
      toast({ title: "Soul updated successfully" })
      onOpenChange(false)
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to update soul" })
    },
  })

  const syncMutation = useMutation({
    mutationFn: (data: {
      source_type: string
      source_config: Record<string, unknown>
    }) => api.syncAgentSoul(agent.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents", agent.id, "soul"] })
      toast({ title: "Soul synced from external source" })
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to sync soul" })
    },
  })

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      await updateMutation.mutateAsync({ cached_content: content })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    toast({ title: "Content copied to clipboard" })
  }

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${agent.id}-soul.md`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: "SOUL template downloaded" })
  }

  const handleConnectSource = async (sourceType: string) => {
    if (!sourceUrl.trim()) {
      toast({ variant: "destructive", title: "Please enter a document URL" })
      return
    }
    setConnectingSource(sourceType)
    try {
      await syncMutation.mutateAsync({
        source_type: sourceType,
        source_config: { document_url: sourceUrl },
      })
      setShowConnectors(false)
      setSourceUrl("")
    } finally {
      setConnectingSource(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="size-5" />
                Edit Soul: {agent.display_name || agent.name}
              </DialogTitle>
              <DialogDescription>
                Define the personality, capabilities, and behavior guidelines
                for this agent.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <div className="flex items-center border rounded-lg p-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={viewMode === "editor" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => setViewMode("editor")}
                      >
                        <Code className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Editor only</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={viewMode === "split" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => setViewMode("split")}
                      >
                        <Columns className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Split view</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={viewMode === "preview" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => setViewMode("preview")}
                      >
                        <Eye className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Preview only</TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={showConnectors ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => setShowConnectors(!showConnectors)}
                    >
                      <ExternalLink className="size-4 mr-1" />
                      Sources
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Connect external source</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      <Copy className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy to clipboard</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                    >
                      <Download className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download as .md</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {showConnectors && (
            <ScrollArea className="max-h-[50vh] border-b">
              <div className="px-6 py-4 bg-muted/20 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      <ExternalLink className="size-4" />
                      Knowledge Sources
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Connect to the same sources your team uses - always up to
                      date
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConnectors(false)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Single Source of Truth:</strong> When your team
                    updates prices in a Sheet or policies in a Doc, the agent
                    sees the changes immediately. No manual re-configuration
                    needed.
                  </p>
                </div>

                {Object.entries(SOUL_CONNECTORS).map(
                  ([categoryKey, category]) => (
                    <div key={categoryKey} className="space-y-3">
                      <div>
                        <h5 className="font-medium text-sm">
                          {category.label}
                        </h5>
                        <p className="text-xs text-muted-foreground">
                          {category.description}
                        </p>
                      </div>
                      <div className="grid gap-2 md:grid-cols-4">
                        {category.items.map((connector) => {
                          const Icon = connector.icon
                          const isCurrentSource =
                            soul?.source_type === connector.id
                          const isSelected = connectingSource === connector.id
                          return (
                            <Card
                              key={connector.id}
                              className={`cursor-pointer transition-all ${
                                isCurrentSource
                                  ? "border-green-500 bg-green-50/50 dark:bg-green-950/30"
                                  : isSelected
                                    ? "border-primary ring-1 ring-primary"
                                    : "hover:border-primary/50"
                              }`}
                              onClick={() => setConnectingSource(connector.id)}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="size-8 rounded flex items-center justify-center shrink-0"
                                    style={{
                                      backgroundColor: `${connector.color}15`,
                                    }}
                                  >
                                    <Icon
                                      className="size-4"
                                      style={{ color: connector.color }}
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">
                                      {connector.name}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground truncate">
                                      {connector.description}
                                    </p>
                                  </div>
                                  {isCurrentSource && (
                                    <Badge className="bg-green-100 text-green-800 text-[10px] h-5 px-1.5">
                                      Active
                                    </Badge>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    </div>
                  )
                )}

                {connectingSource && (
                  <Card className="border-primary">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium">
                          Connect to{" "}
                          {
                            getAllConnectors().find(
                              (i) => i.id === connectingSource
                            )?.name
                          }
                        </h5>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConnectingSource(null)}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-xs">
                            Source URL / Connection String
                          </Label>
                          <Input
                            placeholder={
                              connectingSource.includes("sheet")
                                ? "https://docs.google.com/spreadsheets/d/..."
                                : connectingSource.includes("hub")
                                  ? "https://app.hubspot.com/..."
                                  : connectingSource.includes("postgres")
                                    ? "postgresql://user:pass@host/db"
                                    : connectingSource.includes("api")
                                      ? "https://api.yourcompany.com/..."
                                      : "Paste URL or connection string..."
                            }
                            value={sourceUrl}
                            onChange={(e) => setSourceUrl(e.target.value)}
                            className="font-mono text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Sync Frequency</Label>
                          <Select defaultValue="realtime">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="realtime">
                                Real-time (webhook)
                              </SelectItem>
                              <SelectItem value="5min">
                                Every 5 minutes
                              </SelectItem>
                              <SelectItem value="hourly">Hourly</SelectItem>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="manual">
                                Manual only
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {(connectingSource.includes("hub") ||
                        connectingSource.includes("sales") ||
                        connectingSource.includes("pipe") ||
                        connectingSource.includes("zoho")) && (
                        <div className="space-y-2">
                          <Label className="text-xs">
                            Data to include in agent context
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              "Contact info",
                              "Deal details",
                              "Recent activities",
                              "Custom properties",
                              "Notes",
                            ].map((field) => (
                              <Badge
                                key={field}
                                variant="outline"
                                className="cursor-pointer hover:bg-primary/10"
                              >
                                {field}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {connectingSource === "google_sheets" && (
                        <div className="space-y-2">
                          <Label className="text-xs">
                            Sheet/Tab name (optional)
                          </Label>
                          <Input placeholder="e.g., Precios 2024, Catálogo" />
                        </div>
                      )}

                      {(connectingSource === "postgres" ||
                        connectingSource === "rest_api" ||
                        connectingSource === "graphql") && (
                        <div className="space-y-2">
                          <Label className="text-xs">Query / Endpoint</Label>
                          <Textarea
                            placeholder={
                              connectingSource === "postgres"
                                ? "SELECT * FROM products WHERE active = true"
                                : connectingSource === "graphql"
                                  ? "query { products(active: true) { id name price } }"
                                  : "GET /api/v1/products?status=active"
                            }
                            className="font-mono text-sm h-20"
                          />
                        </div>
                      )}

                      {connectingSource === "webpage" && (
                        <div className="space-y-2">
                          <Label className="text-xs">
                            CSS Selector (optional - to extract specific
                            content)
                          </Label>
                          <Input
                            placeholder="e.g., .main-content, #pricing-table, article"
                            className="font-mono text-sm"
                          />
                        </div>
                      )}

                      {connectingSource === "sitemap" && (
                        <div className="space-y-2">
                          <Label className="text-xs">
                            URL patterns to include
                          </Label>
                          <Input
                            placeholder="e.g., /products/*, /pricing, /faq/*"
                            className="font-mono text-sm"
                          />
                        </div>
                      )}

                      {connectingSource === "youtube" && (
                        <div className="space-y-2">
                          <Label className="text-xs">What to extract</Label>
                          <div className="flex gap-2">
                            {[
                              "Transcript",
                              "Description",
                              "Comments (top 50)",
                            ].map((opt) => (
                              <Badge
                                key={opt}
                                variant="outline"
                                className="cursor-pointer hover:bg-primary/10"
                              >
                                {opt}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {(connectingSource === "slack_channel" ||
                        connectingSource === "email_inbox") && (
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label className="text-xs">Channel / Folder</Label>
                            <Input
                              placeholder={
                                connectingSource === "slack_channel"
                                  ? "#sales-team"
                                  : "Inbox / Sent"
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Time range</Label>
                            <Select defaultValue="30d">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="7d">Last 7 days</SelectItem>
                                <SelectItem value="30d">
                                  Last 30 days
                                </SelectItem>
                                <SelectItem value="90d">
                                  Last 90 days
                                </SelectItem>
                                <SelectItem value="all">All time</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          variant="outline"
                          onClick={() => setConnectingSource(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          disabled={!sourceUrl.trim() || syncMutation.isPending}
                          onClick={() => handleConnectSource(connectingSource)}
                        >
                          {syncMutation.isPending ? (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                          ) : (
                            <Check className="mr-2 size-4" />
                          )}
                          Connect & Sync
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 space-y-2">
                  <p>
                    <strong>How it works:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      <strong>Documents:</strong> Agent reads instructions/SOPs
                      from your team's docs
                    </li>
                    <li>
                      <strong>Live Data:</strong> Prices, inventory, schedules -
                      updated in real-time
                    </li>
                    <li>
                      <strong>CRM:</strong> Customer context injected
                      automatically per conversation
                    </li>
                    <li>
                      <strong>Databases:</strong> Direct SQL/API queries for
                      custom data
                    </li>
                  </ul>
                  <p className="mt-2 text-blue-600 dark:text-blue-400">
                    Tip: Your team updates prices in the Sheet → Agent
                    immediately uses new prices. Zero manual work.
                  </p>
                </div>
              </div>
            </ScrollArea>
          )}

          {soul && (
            <div className="flex items-center justify-between text-sm text-muted-foreground border-b px-4 py-2 bg-muted/30">
              <div className="flex items-center gap-4">
                <span>
                  Source:{" "}
                  <Badge variant="outline">
                    {soul.source_type || "inline"}
                  </Badge>
                </span>
                {soul.last_sync_at && (
                  <span>
                    Last sync: {format(new Date(soul.last_sync_at), "PPp")}
                  </span>
                )}
                <span>Version: {soul.version}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs">
                  {stats.words} words • {stats.chars} chars • {stats.lines}{" "}
                  lines
                </span>
                {soul.source_type && soul.source_type !== "inline" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      syncMutation.mutate({
                        source_type: soul.source_type!,
                        source_config: {
                          document_url: soul.source_document_url,
                        },
                      })
                    }
                    disabled={syncMutation.isPending}
                  >
                    {syncMutation.isPending ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 size-4" />
                    )}
                    Sync
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="flex-1 min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="size-8 animate-spin" />
              </div>
            ) : viewMode === "split" ? (
              <ResizablePanelGroup direction="horizontal" className="h-full">
                <ResizablePanel defaultSize={50} minSize={30}>
                  <div className="h-full flex flex-col">
                    <div className="px-4 py-2 border-b bg-muted/30 text-sm font-medium flex items-center gap-2">
                      <Code className="size-4" />
                      Editor (Markdown)
                    </div>
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="flex-1 resize-none font-mono text-sm rounded-none border-0 focus-visible:ring-0"
                      placeholder="Write your SOUL template here using Markdown..."
                    />
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={50} minSize={30}>
                  <div className="h-full flex flex-col">
                    <div className="px-4 py-2 border-b bg-muted/30 text-sm font-medium flex items-center gap-2">
                      <Eye className="size-4" />
                      Preview
                    </div>
                    <ScrollArea className="flex-1">
                      <div className="p-4">
                        <SimpleMarkdownPreview
                          content={
                            content || "*Start writing to see preview...*"
                          }
                        />
                      </div>
                    </ScrollArea>
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : viewMode === "editor" ? (
              <div className="h-full flex flex-col">
                <div className="px-4 py-2 border-b bg-muted/30 text-sm font-medium flex items-center gap-2">
                  <Code className="size-4" />
                  Editor (Markdown)
                </div>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="flex-1 resize-none font-mono text-sm rounded-none border-0 focus-visible:ring-0"
                  placeholder="Write your SOUL template here using Markdown..."
                />
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <div className="px-4 py-2 border-b bg-muted/30 text-sm font-medium flex items-center gap-2">
                  <Eye className="size-4" />
                  Preview
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-6">
                    <SimpleMarkdownPreview
                      content={content || "*No content yet...*"}
                    />
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-muted-foreground">
              Tip: Use {"{{COMPANY_NAME}}"}, {"{{AGENT_NAME}}"} for dynamic
              variables
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                <X className="mr-2 size-4" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Save className="mr-2 size-4" />
                )}
                Save Soul
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
