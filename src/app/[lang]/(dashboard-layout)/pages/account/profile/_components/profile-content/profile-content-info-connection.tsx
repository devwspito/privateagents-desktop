"use client"

import { Bot } from "lucide-react"

import { useMyAgent } from "@/lib/api/hooks"
import { getInitials } from "@/lib/utils"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ProfileContentConnection() {
  const { data: agent } = useMyAgent()

  return (
    <Card asChild>
      <article>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="size-4" />
            My Agent
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agent ? (
            <div className="flex items-center gap-3">
              <Avatar className="size-10">
                <AvatarImage src={agent.avatar_url ?? undefined} alt="" />
                <AvatarFallback>
                  {getInitials(agent.display_name || agent.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">
                  {agent.display_name || agent.name}
                </p>
                {agent.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {agent.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant={agent.enabled ? "default" : "secondary"}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {agent.enabled ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {agent.model_id}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No agent linked to your account yet.
            </p>
          )}
        </CardContent>
      </article>
    </Card>
  )
}
