"use client"

import { useState } from "react"
import { useSession } from "@/providers/auth-provider"
import {
  ArrowLeftRight,
  Info,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
} from "lucide-react"

import type { CommunicationRule, Department } from "@/lib/api"
import {
  useCommunicationRules,
  useCreateCommunicationRule,
  useUpdateCommunicationRule,
  useDeleteCommunicationRule,
  useDepartments,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function CommunicationRulesPage() {
  const { data: session } = useSession()
  const enterpriseId = session?.user?.enterprise_id

  const { data: rules, isLoading, refetch } = useCommunicationRules()
  const { data: departmentsData } = useDepartments(enterpriseId)
  const departments: Department[] = departmentsData?.items ?? []

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<CommunicationRule | null>(null)
  const [deletingRule, setDeletingRule] = useState<CommunicationRule | null>(null)

  const deleteRule = useDeleteCommunicationRule()

  const hasWildcard = rules?.some(
    (r) => r.from_department_id === "*" && r.to_department_id === "*"
  )

  const handleDelete = () => {
    if (!deletingRule) return
    deleteRule.mutate(deletingRule.id, {
      onSuccess: () => {
        toast({ title: "Regla eliminada" })
        setDeletingRule(null)
      },
      onError: () => {
        toast({ variant: "destructive", title: "Error al eliminar regla" })
      },
    })
  }

  if (isLoading) {
    return (
      <div className="container p-6 flex justify-center items-center h-64">
        <Loader2 className="size-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ArrowLeftRight className="size-6" />
            Reglas de Comunicación
          </h1>
          <p className="text-muted-foreground">
            Configura qué departamentos pueden comunicarse entre sí (A2A)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="size-4" />
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 size-4" />
            Nueva Regla
          </Button>
        </div>
      </div>

      {/* Status banner */}
      {hasWildcard && (
        <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-green-700 dark:text-green-400">
              <Shield className="size-4" />
              Comunicación libre activa
            </CardTitle>
            <CardDescription className="text-green-600 dark:text-green-500">
              Todos los agentes pueden comunicarse entre sí sin restricciones.
              Elimina la regla &quot;Todos → Todos&quot; para usar reglas
              departamentales específicas.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!hasWildcard && rules && rules.length === 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Info className="size-4" />
              Sin reglas de comunicación
            </CardTitle>
            <CardDescription className="text-amber-600 dark:text-amber-500">
              Los agentes no pueden comunicarse entre sí. Crea una regla para
              habilitar la comunicación A2A.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Reglas</CardDescription>
            <CardTitle className="text-3xl">{rules?.length ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Departamentos</CardDescription>
            <CardTitle className="text-3xl">{departments.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Modo</CardDescription>
            <CardTitle className="text-xl">
              {hasWildcard ? "Comunicación libre" : "Reglas específicas"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Rules table */}
      {rules && rules.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Desde</TableHead>
                  <TableHead>Hacia</TableHead>
                  <TableHead className="text-center">Consultar</TableHead>
                  <TableHead className="text-center">Solicitar</TableHead>
                  <TableHead className="text-center">Escalar</TableHead>
                  <TableHead className="text-center">Delegar</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {rule.from_department_id === "*" ? (
                          <Badge variant="secondary">Todos</Badge>
                        ) : (
                          <span>{rule.from_department_name}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {rule.to_department_id === "*" ? (
                          <Badge variant="secondary">Todos</Badge>
                        ) : (
                          <span>{rule.to_department_name}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={rule.can_query ? "default" : "outline"}
                        className="text-xs"
                      >
                        {rule.can_query ? "Sí" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={rule.can_request ? "default" : "outline"}
                        className="text-xs"
                      >
                        {rule.can_request ? "Sí" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={rule.can_escalate ? "default" : "outline"}
                        className="text-xs"
                      >
                        {rule.can_escalate ? "Sí" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={rule.can_delegate ? "default" : "outline"}
                        className="text-xs"
                      >
                        {rule.can_delegate ? "Sí" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => setEditingRule(rule)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive"
                          onClick={() => setDeletingRule(rule)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <RuleDialog
        open={isCreateOpen || !!editingRule}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false)
            setEditingRule(null)
          }
        }}
        rule={editingRule}
        departments={departments}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deletingRule}
        onOpenChange={(open) => {
          if (!open) setDeletingRule(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar regla</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingRule?.from_department_id === "*" ? (
                <>
                  Vas a eliminar la regla de <strong>comunicación libre</strong>.
                  Los agentes ya no podrán comunicarse entre sí a menos que
                  existan reglas departamentales específicas.
                </>
              ) : (
                <>
                  Se eliminará la regla de comunicación entre{" "}
                  <strong>{deletingRule?.from_department_name}</strong> y{" "}
                  <strong>{deletingRule?.to_department_name}</strong>.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function RuleDialog({
  open,
  onOpenChange,
  rule,
  departments,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule: CommunicationRule | null
  departments: Department[]
}) {
  const isEditing = !!rule

  const [fromDept, setFromDept] = useState(rule?.from_department_id ?? "*")
  const [toDept, setToDept] = useState(rule?.to_department_id ?? "*")
  const [canQuery, setCanQuery] = useState(rule?.can_query ?? true)
  const [canRequest, setCanRequest] = useState(rule?.can_request ?? true)
  const [canEscalate, setCanEscalate] = useState(rule?.can_escalate ?? true)
  const [canDelegate, setCanDelegate] = useState(rule?.can_delegate ?? true)

  const createRule = useCreateCommunicationRule()
  const updateRule = useUpdateCommunicationRule()

  // Reset form when rule changes
  const [lastRuleId, setLastRuleId] = useState<string | null>(null)
  if ((rule?.id ?? null) !== lastRuleId) {
    setLastRuleId(rule?.id ?? null)
    setFromDept(rule?.from_department_id ?? "*")
    setToDept(rule?.to_department_id ?? "*")
    setCanQuery(rule?.can_query ?? true)
    setCanRequest(rule?.can_request ?? true)
    setCanEscalate(rule?.can_escalate ?? true)
    setCanDelegate(rule?.can_delegate ?? true)
  }

  const handleSubmit = () => {
    if (isEditing) {
      updateRule.mutate(
        {
          id: rule.id,
          data: {
            can_query: canQuery,
            can_request: canRequest,
            can_escalate: canEscalate,
            can_delegate: canDelegate,
          },
        },
        {
          onSuccess: () => {
            toast({ title: "Regla actualizada" })
            onOpenChange(false)
          },
          onError: () => {
            toast({ variant: "destructive", title: "Error al actualizar" })
          },
        }
      )
    } else {
      createRule.mutate(
        {
          from_department_id: fromDept,
          to_department_id: toDept,
          can_query: canQuery,
          can_request: canRequest,
          can_escalate: canEscalate,
          can_delegate: canDelegate,
        },
        {
          onSuccess: () => {
            toast({ title: "Regla creada" })
            onOpenChange(false)
          },
          onError: () => {
            toast({ variant: "destructive", title: "Error al crear regla" })
          },
        }
      )
    }
  }

  const isPending = createRule.isPending || updateRule.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Regla" : "Nueva Regla de Comunicación"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los permisos de comunicación"
              : "Define qué departamentos pueden comunicarse entre sí"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* From department */}
          <div className="space-y-2">
            <Label>Desde</Label>
            <Select
              value={fromDept}
              onValueChange={setFromDept}
              disabled={isEditing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="*">Todos los departamentos</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.display_name || d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* To department */}
          <div className="space-y-2">
            <Label>Hacia</Label>
            <Select
              value={toDept}
              onValueChange={setToDept}
              disabled={isEditing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="*">Todos los departamentos</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.display_name || d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Permissions */}
          <div className="space-y-3 rounded-lg border p-4">
            <Label className="text-sm font-medium">Permisos</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Consultar</p>
                  <p className="text-xs text-muted-foreground">
                    Puede pedir información
                  </p>
                </div>
                <Switch checked={canQuery} onCheckedChange={setCanQuery} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Solicitar</p>
                  <p className="text-xs text-muted-foreground">
                    Puede hacer peticiones
                  </p>
                </div>
                <Switch checked={canRequest} onCheckedChange={setCanRequest} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Escalar</p>
                  <p className="text-xs text-muted-foreground">
                    Puede escalar tareas
                  </p>
                </div>
                <Switch
                  checked={canEscalate}
                  onCheckedChange={setCanEscalate}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Delegar</p>
                  <p className="text-xs text-muted-foreground">
                    Puede delegar trabajo
                  </p>
                </div>
                <Switch
                  checked={canDelegate}
                  onCheckedChange={setCanDelegate}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isEditing ? "Guardar" : "Crear Regla"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
