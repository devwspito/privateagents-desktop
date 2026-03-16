"use client"

import Link from "next/link"
import { useSession, useAuth } from "@/providers/auth-provider"
import { Building, LogOut, User, UserCog } from "lucide-react"

import type { DictionaryType } from "@/lib/get-dictionary"
import type { LocaleType } from "@/types"

import { ensureLocalizedPathname } from "@/lib/i18n"
import { getInitials } from "@/lib/utils"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function UserDropdown({
  dictionary,
  locale,
}: {
  dictionary: DictionaryType
  locale: LocaleType
}) {
  const { data: session } = useSession()
  const { signOut } = useAuth()
  const user = session?.user

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-lg"
          aria-label="User"
        >
          <Avatar className="size-9">
            <AvatarImage src={user?.avatar ?? undefined} alt="" />
            <AvatarFallback className="bg-transparent">
              {user?.name && getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent forceMount>
        <DropdownMenuLabel className="flex gap-2">
          <Avatar>
            <AvatarImage src={user?.avatar ?? undefined} alt="Avatar" />
            <AvatarFallback className="bg-transparent">
              {user?.name && getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <p className="text-sm font-medium truncate">
              {user?.name || "Guest"}
            </p>
            <p className="text-xs text-muted-foreground font-semibold truncate">
              {user?.email}
            </p>
            {user?.role && (
              <Badge variant="secondary" className="mt-1 w-fit text-xs">
                {user.role}
              </Badge>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className="max-w-48">
          <DropdownMenuItem asChild>
            <Link
              href={ensureLocalizedPathname("/pages/account/profile", locale)}
            >
              <User className="me-2 size-4" />
              {dictionary.navigation.userNav.profile}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href={ensureLocalizedPathname("/pages/account/settings", locale)}
            >
              <UserCog className="me-2 size-4" />
              {dictionary.navigation.userNav.settings}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={ensureLocalizedPathname("/dashboard", locale)}>
              <Building className="me-2 size-4" />
              Dashboard
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut className="me-2 size-4" />
          {dictionary.navigation.userNav.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
