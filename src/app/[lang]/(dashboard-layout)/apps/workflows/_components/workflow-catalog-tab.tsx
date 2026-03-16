"use client"

import { useCallback, useMemo, useState } from "react"
import { useSession } from "@/providers/auth-provider"
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Filter,
  Loader2,
  Package,
  Play,
  Search,
  Sparkles,
  Tag,
  Wrench,
  X,
  Zap,
} from "lucide-react"

import type { CatalogEntry, CatalogReadinessResponse, Department } from "@/lib/api/client"
import {
  useWorkflowCatalog,
  useCheckCatalogReadiness,
  useActivateCatalogWorkflow,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<string, string> = {
  executive: "Dirección",
  marketing: "Marketing",
  hr: "Recursos Humanos",
  finance: "Finanzas",
  tech: "Tecnología",
}

const DEPT_LABELS: Record<string, string> = {
  "direccion-general": "Dirección General",
  "marketing-paid": "Paid Media",
  "rrss-manager": "RRSS Manager",
  rrhh: "Recursos Humanos",
  "asesoria-fiscal": "Asesoría Fiscal",
  "asesoria-laboral": "Asesoría Laboral",
  "asesoria-contable": "Contable-Mercantil",
  support: "Support",
  "dev-team": "Developer Team",
  "design-studio": "Design Studio",
  "product-concept": "Product Concept",
  "lead-management-qa": "Lead Management QA",
  "tools-factory": "Tools Factory",
}

const PATTERN_LABELS: Record<string, string> = {
  sequential: "Secuencial",
  fan_out_fan_in: "Fan-out / Fan-in",
  triage_routing: "Triage / Routing",
  approval_gates: "Approval Gates",
  feedback_loop: "Feedback Loop",
}

const TRIGGER_ICONS: Record<string, typeof Clock> = {
  manual: Play,
  cron: Clock,
  event: Zap,
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface WorkflowCatalogTabProps {
  departments: Department[]
}

export function WorkflowCatalogTab({ departments }: WorkflowCatalogTabProps) {
  const { data: session } = useSession()
  const enterpriseId = session?.user?.enterprise_id ?? ""

  // Filters
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [deptFilter, setDeptFilter] = useState<string>("all")

  // Data
  const { data: catalog, isLoading } = useWorkflowCatalog()
  const checkReadiness = useCheckCatalogReadiness()
  const activateWorkflow = useActivateCatalogWorkflow()

  // Detail dialog
  const [selectedEntry, setSelectedEntry] = useState<CatalogEntry | null>(null)
  const [readiness, setReadiness] = useState<CatalogReadinessResponse | null>(null)
  const [checkingReadiness, setCheckingReadiness] = useState(false)

  const entries = useMemo(() => {
    let list = catalog ?? []
    if (categoryFilter !== "all") {
      list = list.filter((e) => e.category === categoryFilter)
    }
    if (deptFilter !== "all") {
      list = list.filter((e) => e.department_template_id === deptFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (e) =>
          e.display_name.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q))
      )
    }
    return list
  }, [catalog, categoryFilter, deptFilter, search])

  // Group by department
  const grouped = useMemo(() => {
    const map = new Map<string, CatalogEntry[]>()
    for (const e of entries) {
      const key = e.department_template_id
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(e)
    }
    return Array.from(map.entries()).sort(([a], [b]) => {
      const la = DEPT_LABELS[a] ?? a
      const lb = DEPT_LABELS[b] ?? b
      return la.localeCompare(lb)
    })
  }, [entries])

  // Resolve department_template_id → real department.id for this enterprise
  const deptTemplateToId = useMemo(() => {
    const map = new Map<string, string>()
    for (const dept of departments) {
      // Match by name pattern: enterprise departments have names like "tools-factory", "paid_media" etc.
      // The department_template_id in catalog is the template slug
      // We match by checking if dept.id ends with the template id or dept.name matches
      const deptName = dept.name.replace(/_/g, "-").toLowerCase()
      for (const tmplId of Object.keys(DEPT_LABELS)) {
        const tmplNorm = tmplId.replace(/_/g, "-").toLowerCase()
        if (
          deptName === tmplNorm ||
          deptName.includes(tmplNorm) ||
          dept.id.includes(tmplNorm)
        ) {
          map.set(tmplId, dept.id)
        }
      }
    }
    return map
  }, [departments])

  const handleOpenDetail = useCallback(
    async (entry: CatalogEntry) => {
      setSelectedEntry(entry)
      setReadiness(null)
      const realDeptId = deptTemplateToId.get(entry.department_template_id)
      if (realDeptId && enterpriseId) {
        setCheckingReadiness(true)
        try {
          const result = await checkReadiness.mutateAsync({
            catalogId: entry.id,
            enterprise_id: enterpriseId,
            department_id: realDeptId,
          })
          setReadiness(result)
        } catch {
          // Readiness check failed — not blocking
        } finally {
          setCheckingReadiness(false)
        }
      }
    },
    [checkReadiness, deptTemplateToId, enterpriseId]
  )

  const handleActivate = useCallback(async () => {
    if (!selectedEntry || !enterpriseId) return
    const realDeptId = deptTemplateToId.get(selectedEntry.department_template_id)
    if (!realDeptId) {
      toast({
        title: "Departamento no encontrado",
        description: `No se encontró el departamento "${DEPT_LABELS[selectedEntry.department_template_id] ?? selectedEntry.department_template_id}" en esta empresa.`,
        variant: "destructive",
      })
      return
    }
    try {
      await activateWorkflow.mutateAsync({
        catalogId: selectedEntry.id,
        data: {
          enterprise_id: enterpriseId,
          department_id: realDeptId,
        },
      })
      toast({ title: "Workflow activado", description: `"${selectedEntry.display_name}" está listo para ejecutarse.` })
      setSelectedEntry(null)
    } catch (err) {
      toast({
        title: "Error al activar",
        description: String(err),
        variant: "destructive",
      })
    }
  }, [selectedEntry, enterpriseId, deptTemplateToId, activateWorkflow])

  // Categories and depts present in catalog
  const availableCategories = useMemo(() => {
    const cats = new Set((catalog ?? []).map((e) => e.category))
    return Array.from(cats).sort()
  }, [catalog])

  const availableDepts = useMemo(() => {
    const depts = new Set((catalog ?? []).map((e) => e.department_template_id))
    return Array.from(depts).sort()
  }, [catalog])

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar workflows..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px]">
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {availableCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {CATEGORY_LABELS[cat] ?? cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-[200px]">
            <Package className="h-3.5 w-3.5 mr-1.5" />
            <SelectValue placeholder="Departamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los departamentos</SelectItem>
            {availableDepts.map((d) => (
              <SelectItem key={d} value={d}>
                {DEPT_LABELS[d] ?? d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground">
          {entries.length} workflow{entries.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Grid grouped by department */}
      {entries.length === 0 ? (
        <Card>
          <CardHeader className="text-center">
            <CardDescription>
              No se encontraron workflows con esos filtros.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        grouped.map(([deptTmplId, deptEntries]) => (
          <div key={deptTmplId} className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {DEPT_LABELS[deptTmplId] ?? deptTmplId} ({deptEntries.length})
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {deptEntries.map((entry) => {
                const TriggerIcon =
                  TRIGGER_ICONS[entry.trigger_type] ?? Play
                return (
                  <Card
                    key={entry.id}
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => handleOpenDetail(entry)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm leading-tight">
                          {entry.display_name}
                        </CardTitle>
                        <TriggerIcon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      </div>
                      <CardDescription className="text-xs line-clamp-2">
                        {entry.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 pb-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {PATTERN_LABELS[entry.pattern] ?? entry.pattern}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {entry.steps.length} pasos
                        </Badge>
                        {entry.estimated_duration_minutes > 0 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            ~{entry.estimated_duration_minutes}min
                          </Badge>
                        )}
                        {entry.required_tools.length > 0 && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            <Wrench className="h-2.5 w-2.5 mr-0.5" />
                            {entry.required_tools.length} tool{entry.required_tools.length !== 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                      {entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {entry.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {entry.tags.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{entry.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ))
      )}

      {/* Detail / Activate Dialog */}
      <Dialog
        open={!!selectedEntry}
        onOpenChange={(open) => {
          if (!open) setSelectedEntry(null)
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedEntry && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  {selectedEntry.display_name}
                </DialogTitle>
                <DialogDescription>
                  {selectedEntry.description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Metadata */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Departamento</span>
                    <p className="font-medium">
                      {DEPT_LABELS[selectedEntry.department_template_id] ??
                        selectedEntry.department_template_id}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Patrón</span>
                    <p className="font-medium">
                      {PATTERN_LABELS[selectedEntry.pattern] ?? selectedEntry.pattern}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Trigger</span>
                    <p className="font-medium capitalize">
                      {selectedEntry.trigger_type}
                      {selectedEntry.trigger_config?.cron
                        ? ` (${selectedEntry.trigger_config.cron})`
                        : ""}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duración est.</span>
                    <p className="font-medium">
                      ~{selectedEntry.estimated_duration_minutes} min
                    </p>
                  </div>
                </div>

                {/* Steps */}
                <div>
                  <p className="text-sm font-medium mb-2">
                    Pasos ({selectedEntry.steps.length})
                  </p>
                  <div className="space-y-1.5">
                    {selectedEntry.steps.map((step, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-xs bg-muted/50 rounded px-2.5 py-1.5"
                      >
                        <span className="font-mono text-muted-foreground shrink-0 w-5">
                          {i + 1}.
                        </span>
                        <div className="min-w-0">
                          <span className="font-medium">
                            {(step as Record<string, unknown>).type === "require_approval"
                              ? `Approval: ${(step as Record<string, unknown>).title ?? "Revisión"}`
                              : (step as Record<string, unknown>).agent_role ?? "Agent task"}
                          </span>
                          {(step as Record<string, unknown>).output_key && (
                            <span className="text-muted-foreground ml-1">
                              → {String((step as Record<string, unknown>).output_key)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Required tools */}
                {selectedEntry.required_tools.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                      <Wrench className="h-3.5 w-3.5" />
                      Integraciones requeridas
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedEntry.required_tools.map((tool) => {
                        const connected = readiness?.connected_tools.includes(tool)
                        const missing = readiness?.missing_tools.includes(tool)
                        return (
                          <Badge
                            key={tool}
                            variant={missing ? "destructive" : connected ? "default" : "outline"}
                            className="text-xs"
                          >
                            {connected && <Check className="h-3 w-3 mr-0.5" />}
                            {missing && <X className="h-3 w-3 mr-0.5" />}
                            {tool}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Readiness */}
                {checkingReadiness && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verificando disponibilidad...
                  </div>
                )}
                {readiness && !checkingReadiness && (
                  <div
                    className={`flex items-start gap-2 text-sm rounded-md px-3 py-2 ${
                      readiness.ready
                        ? "bg-green-500/10 text-green-700 dark:text-green-400"
                        : "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                    }`}
                  >
                    {readiness.ready ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    )}
                    <div>
                      {readiness.ready ? (
                        <p>Listo para activar. Todas las integraciones conectadas y agentes resueltos.</p>
                      ) : (
                        <div className="space-y-1">
                          {readiness.missing_tools.length > 0 && (
                            <p>
                              Faltan integraciones:{" "}
                              {readiness.missing_tools.join(", ")}
                            </p>
                          )}
                          {!readiness.agents_resolved && (
                            <p>No se pudieron resolver todos los agentes del departamento.</p>
                          )}
                          <p className="text-xs opacity-75">
                            Puedes activarlo igualmente, pero algunos pasos podrían fallar.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {selectedEntry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                    {selectedEntry.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSelectedEntry(null)}
                >
                  Cerrar
                </Button>
                <Button
                  onClick={handleActivate}
                  disabled={activateWorkflow.isPending}
                >
                  {activateWorkflow.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : (
                    <Zap className="h-4 w-4 mr-1.5" />
                  )}
                  Activar Workflow
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
