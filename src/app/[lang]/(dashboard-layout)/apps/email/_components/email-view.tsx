"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"

import { useEmailMessage, useUpdateEmailMessage } from "@/lib/api/hooks"

import { Card } from "@/components/ui/card"
import { EmailNotFound } from "./email-not-found"
import { EmailViewContent } from "./email-view-content"
import { EmailViewHeader } from "./email-view-header"

export function EmailView() {
  const params = useParams()
  const emailIdParam = params["id"] as string

  const { data: email, isLoading } = useEmailMessage(emailIdParam || null)
  const updateMessage = useUpdateEmailMessage()

  // Mark as read on mount
  useEffect(() => {
    if (email && !email.is_read) {
      updateMessage.mutate({ messageId: email.id, data: { is_read: true } })
    }
  }, [email?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <Card className="flex-1 w-full md:w-auto flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </Card>
    )
  }

  if (!email) return <EmailNotFound />

  return (
    <Card className="flex-1 w-full md:w-auto">
      <EmailViewHeader email={email} />
      <EmailViewContent email={email} />
    </Card>
  )
}
