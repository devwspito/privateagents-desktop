"use client"

import type { EmailMessageDetail } from "../types"

import { formatDate, getInitials } from "@/lib/utils"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function EmailViewContentHeader({
  email,
}: {
  email: EmailMessageDetail
}) {
  const senderName =
    email.from_name || email.from_address || email.from || "Unknown"

  return (
    <Card className="py-1">
      <CardHeader className="flex-row items-center gap-2 py-3">
        <Avatar>
          <AvatarFallback>{getInitials(senderName)}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle>{senderName}</CardTitle>
          <CardDescription>{email.from_address || email.from}</CardDescription>
        </div>
        {email.account_color && (
          <span
            className="h-3 w-3 rounded-full shrink-0"
            style={{ backgroundColor: email.account_color }}
            title={email.account_email || email.account_provider || ""}
          />
        )}
        <CardDescription className="ms-auto">
          {formatDate(new Date(email.received_at ?? email.date ?? ""))}
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
