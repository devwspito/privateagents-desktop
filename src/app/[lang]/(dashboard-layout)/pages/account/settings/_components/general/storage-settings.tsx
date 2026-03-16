"use client"

import { useEffect, useState } from "react"
import { HardDrive, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSession } from "@/providers/auth-provider"
import { useEnterprise, useUpdateEnterprise } from "@/lib/api/react-hooks/enterprise"

type RetentionMode = "never" | "custom"

export function StorageSettings() {
  const { data: session } = useSession()
  const enterpriseId = session?.user?.enterprise_id || ""
  const isAdmin = session?.user?.role === "admin"

  const { data: enterprise } = useEnterprise(enterpriseId)
  const updateEnterprise = useUpdateEnterprise()

  const [mode, setMode] = useState<RetentionMode>("never")
  const [customDays, setCustomDays] = useState(30)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const days = enterprise?.settings?.deliverable_retention_days
    if (days != null) {
      const numDays = Number(days)
      if (numDays === 0) {
        setMode("never")
      } else {
        setMode("custom")
        setCustomDays(numDays)
      }
    }
  }, [enterprise?.settings?.deliverable_retention_days])

  if (!isAdmin) return null

  const handleSave = () => {
    const days = mode === "never" ? 0 : Math.max(1, Math.min(365, customDays))
    if (mode === "custom") setCustomDays(days)

    updateEnterprise.mutate(
      {
        id: enterpriseId,
        data: { settings: { deliverable_retention_days: days } },
      },
      {
        onSuccess: () => {
          setSaved(true)
          setTimeout(() => setSaved(false), 3000)
        },
      }
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="size-5" />
          Almacenamiento y Retención
        </CardTitle>
        <CardDescription>
          Configura cuánto tiempo se conservan los archivos entregados por los
          agentes en el servidor. Los archivos en el ordenador del usuario nunca
          se eliminan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-4">
          <div className="space-y-2">
            <Label>Retención de archivos en el servidor</Label>
            <Select
              value={mode}
              onValueChange={(v) => setMode(v as RetentionMode)}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Conservar siempre</SelectItem>
                <SelectItem value="custom">Eliminar después de...</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === "custom" && (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={365}
                value={customDays}
                onChange={(e) => setCustomDays(Number(e.target.value))}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">días</span>
            </div>
          )}

          <Button
            onClick={handleSave}
            disabled={updateEnterprise.isPending}
            size="sm"
          >
            {updateEnterprise.isPending ? (
              <Loader2 className="size-4 animate-spin mr-1" />
            ) : null}
            {saved ? "Guardado" : "Guardar"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {mode === "never"
            ? "Los archivos se conservan indefinidamente en el servidor."
            : `Pasados ${customDays} días, los enlaces de descarga dejarán de funcionar y los archivos se eliminarán del servidor.`}
          {" "}Los archivos guardados en el ordenador del usuario (espejo local) nunca se borran.
        </p>
      </CardContent>
    </Card>
  )
}
