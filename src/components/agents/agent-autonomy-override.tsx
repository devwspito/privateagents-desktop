"use client"

import { Info, ShieldCheck } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface AgentAutonomyOverrideProps {
  agent: {
    id: string
    name?: string
    display_name?: string
  }
  onUpdate?: () => void
}

export function AgentAutonomyOverride({ agent }: AgentAutonomyOverrideProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ShieldCheck className="size-5" />
            Flujo de Trabajo
          </h3>
          <p className="text-sm text-muted-foreground">
            {agent.display_name || agent.name}
          </p>
        </div>
        <Badge variant="default">SUPERVISADO</Badge>
      </div>

      <Alert>
        <Info className="size-4" />
        <AlertDescription>
          El flujo de trabajo es fijo. El agente trabaja libremente pero siempre
          requiere aprobación humana para decisiones finales.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Reglas del Flujo</CardTitle>
          <CardDescription>
            Estas reglas son fijas y no se pueden modificar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <ShieldCheck className="size-4 text-primary mt-0.5" />
              <div>
                <span className="font-medium">
                  Aprobación Final Obligatoria
                </span>
                <p className="text-sm text-muted-foreground">
                  Antes de enviar cualquier respuesta definitiva, el agente
                  pregunta al humano si está de acuerdo
                </p>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ejemplo del Flujo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2 bg-muted/50 p-4 rounded-lg">
            <p className="text-muted-foreground"># Otro agente pregunta:</p>
            <p>
              @dragan-agente: "oye @luiscorrea-agente, ¿ya tienes el objetivo de
              marzo?"
            </p>
            <p className="text-muted-foreground mt-3">
              # Tu agente te consulta:
            </p>
            <p>
              @luiscorrea-agente: "@luiscorrea encontré el archivo
              objetivo-marzo.pdf en Drive. ¿Quieres que lo envíe?"
            </p>
            <p className="text-muted-foreground mt-3"># Tú apruebas:</p>
            <p>@luiscorrea-humano: "Sí, envíalo"</p>
            <p className="text-muted-foreground mt-3"># Tu agente responde:</p>
            <p>
              @luiscorrea-agente: "@dragan-agente te adjunto el objetivo de
              marzo. ¿Lo revisamos?"
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
