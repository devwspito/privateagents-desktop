import { Check, CheckCheck, LoaderCircle } from "lucide-react"

import type { MessageType } from "../types"

export function MessageBubbleStatusIcon({
  status,
}: {
  status: MessageType["status"]
}) {
  switch (status) {
    case "SENT":
      return <Check className="size-3.5" aria-label={status} />
    case "DELIVERED":
      return <CheckCheck className="size-3.5" aria-label={status} />
    case "READ":
      return <CheckCheck className="size-3.5" aria-label={status} />
    default:
      return (
        <LoaderCircle
          className="size-3.5 animate-spin"
          aria-label="LOADING"
        />
      )
  }
}
