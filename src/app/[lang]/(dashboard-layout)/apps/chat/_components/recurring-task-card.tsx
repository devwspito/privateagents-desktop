"use client"

import { useState } from "react"
import { Calendar, Check, ChevronDown, Clock, X } from "lucide-react"

import type { RecurringTaskSuggestionEvent } from "../_hooks/use-chat-stream"

import { api } from "@/lib/api"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"

const SCHEDULE_PRESETS = [
  { label: "Diario a las 9:00", value: "0 9 * * *" },
  { label: "Dias laborales 9:00", value: "0 9 * * 1-5" },
  { label: "Semanal (Lunes)", value: "0 9 * * 1" },
  { label: "Cada hora", value: "0 * * * *" },
  { label: "Cada 15 minutos", value: "*/15 * * * *" },
  { label: "Mensual (dia 1)", value: "0 9 1 * *" },
]

export function RecurringTaskCard({
  suggestion,
  agentId,
  onConfirm,
  onDismiss,
}: {
  suggestion: RecurringTaskSuggestionEvent
  agentId: string
  onConfirm: () => void
  onDismiss: () => void
}) {
  const [title, setTitle] = useState(suggestion.title)
  const [schedule, setSchedule] = useState(suggestion.schedule)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateTask = async () => {
    setLoading(true)
    setError(null)
    try {
      await api.createRecurringTaskFromChat({
        agent_id: agentId,
        title,
        schedule,
        timezone: suggestion.timezone,
      })
      onConfirm()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear tarea")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-sm border-green-500/50 bg-green-500/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-green-500" />
            <span>Tarea recurrente</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onDismiss}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Crear automatizacion</p>
      </CardHeader>

      <CardContent className="pb-3 space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Titulo
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Descripcion de la tarea"
            className="h-8 text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Frecuencia
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between h-8 text-sm font-normal"
              >
                <span className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  {SCHEDULE_PRESETS.find((p) => p.value === schedule)?.label ||
                    schedule}
                </span>
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[280px]">
              {SCHEDULE_PRESETS.map((preset) => (
                <DropdownMenuItem
                  key={preset.value}
                  onClick={() => setSchedule(preset.value)}
                >
                  {preset.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}
      </CardContent>

      <CardFooter className="gap-2 pt-0">
        <Button
          size="sm"
          onClick={handleCreateTask}
          disabled={!title.trim() || loading}
          className="gap-1.5"
        >
          <Check className="h-3.5 w-3.5" />
          {loading ? "Creando..." : "Crear tarea"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDismiss}>
          Descartar
        </Button>
      </CardFooter>
    </Card>
  )
}
