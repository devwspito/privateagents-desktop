"use client"

import { useParams } from "next/navigation"

import type { LocaleType } from "@/types"

import { useEmailContext } from "../_hooks/use-email-context"
import { EmailSidebarItem } from "./email-sidebar-item"

export function EmailSidebarList() {
  const { sidebarItems, accounts } = useEmailContext()
  const params = useParams()

  const locale = params["lang"] as LocaleType
  const segmentParam = params["segment"]

  return (
    <ul className="p-3 pt-0">
      <nav className="space-y-1.5">
        {sidebarItems.folders.map((item) => (
          <EmailSidebarItem
            key={item.name}
            item={item}
            segmentParam={segmentParam}
            locale={locale}
          />
        ))}

        <div>
          <h4 className="mt-4 mb-1 ms-4">Labels</h4>
          {sidebarItems.labels.map((item) => (
            <EmailSidebarItem
              key={item.name}
              item={item}
              segmentParam={segmentParam}
              locale={locale}
            />
          ))}
        </div>

        {accounts.length > 0 && (
          <div>
            <h4 className="mt-4 mb-1 ms-4">Accounts</h4>
            {accounts.map((account) => (
              <li
                key={account.id}
                className="flex items-center gap-2 px-4 py-1.5 text-sm"
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: account.color || "#6b7280" }}
                />
                <span className="truncate">{account.email_address}</span>
                <span className="text-xs text-muted-foreground capitalize ms-auto">
                  {account.provider}
                </span>
              </li>
            ))}
          </div>
        )}
      </nav>
    </ul>
  )
}
