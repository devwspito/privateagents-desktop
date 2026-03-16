"use client"

import type { EmailMessageDetail } from "../types"

import { CardContent } from "@/components/ui/card"

export function EmailViewContentBody({ email }: { email: EmailMessageDetail }) {
  if (email.body_html) {
    return (
      <CardContent
        className="prose prose-sm max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: email.body_html }}
      />
    )
  }

  return (
    <CardContent className="whitespace-pre-wrap">
      {email.body_text || ""}
    </CardContent>
  )
}
