"use client"

import { useState, useMemo } from "react"
import { Loader2, Search, AlertCircle } from "lucide-react"

import type { BrowsedResource } from "@/lib/api"
import { useBrowseResources } from "@/lib/api/react-hooks/department-projects"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface ResourceBrowserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  app: string
  resourceType: string
  label: string
  departmentId: string
  onSelect: (items: BrowsedResource[]) => void
}

export function ResourceBrowserDialog({
  open,
  onOpenChange,
  app,
  resourceType,
  label,
  departmentId,
  onSelect,
}: ResourceBrowserDialogProps) {
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const { data, isLoading, error } = useBrowseResources(
    departmentId,
    app,
    resourceType,
    open
  )

  const filteredItems = useMemo(() => {
    if (!data?.items) return []
    if (!search.trim()) return data.items
    const q = search.toLowerCase()
    return data.items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
    )
  }, [data?.items, search])

  const handleConfirm = () => {
    if (!data?.items) return
    const selected = data.items.filter((item) => selectedIds.has(item.id))
    onSelect(selected)
    onOpenChange(false)
    setSelectedIds(new Set())
    setSearch("")
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedIds(new Set())
      setSearch("")
    }
    onOpenChange(isOpen)
  }

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Browse {label}</DialogTitle>
          <DialogDescription>
            Select resources to add to your project
          </DialogDescription>
        </DialogHeader>

        {/* Not connected */}
        {data && !data.connected && (
          <div className="flex items-center gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
            <AlertCircle className="size-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-medium">
                {app.charAt(0).toUpperCase() + app.slice(1)} not connected
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Connect it in the Integrations page first
              </p>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-sm text-destructive p-4">
            Failed to load resources. Please try again.
          </div>
        )}

        {/* Results */}
        {data?.connected && !isLoading && (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter..."
                className="pl-9"
              />
            </div>

            <ScrollArea className="flex-1 -mx-6 px-6 min-h-0">
              <div className="space-y-1 pb-2">
                {filteredItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {search ? "No matches found" : "No resources found"}
                  </p>
                ) : (
                  filteredItems.map((item) => {
                    const isSelected = selectedIds.has(item.id)
                    return (
                      <label
                        key={item.id}
                        className={cn(
                          "flex items-start gap-3 p-2.5 rounded-md cursor-pointer hover:bg-muted/50",
                          isSelected && "bg-primary/5"
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleItem(item.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {item.name}
                          </p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              {item.description}
                            </p>
                          )}
                          {item.metadata?.default_branch && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              branch: {String(item.metadata.default_branch)}
                            </p>
                          )}
                        </div>
                        {item.metadata?.private && (
                          <span className="text-xs text-muted-foreground border rounded px-1.5 py-0.5">
                            private
                          </span>
                        )}
                      </label>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedIds.size === 0 || !data?.connected}
          >
            Add {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
