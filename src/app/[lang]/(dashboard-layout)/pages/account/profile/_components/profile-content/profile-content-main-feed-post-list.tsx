import { MessageSquare } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

export function ProfileContentPostList() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <MessageSquare className="size-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">No posts yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Activity from your agent will appear here.
        </p>
      </CardContent>
    </Card>
  )
}
