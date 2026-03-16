import type { EmailMessageDetail } from "../types"

import { useEmailContext } from "../_hooks/use-email-context"
import { ScrollArea } from "@/components/ui/scroll-area"
import { EmailListContentItemMoblie } from "./email-list-content-item-mobile"

export function EmailListContentMobile() {
  const { emailState } = useEmailContext()

  const selectedEmailsSet = new Set(
    emailState.selectedEmails.map((email) => email.id)
  )

  return (
    <ul className="flex-1 min-h-0">
      <ScrollArea className="h-full">
        {emailState.emails.map((email: EmailMessageDetail) => {
          const isSelected = selectedEmailsSet.has(email.id)

          return (
            <EmailListContentItemMoblie
              key={email.id}
              email={email}
              isSelected={isSelected}
            />
          )
        })}
      </ScrollArea>
    </ul>
  )
}
