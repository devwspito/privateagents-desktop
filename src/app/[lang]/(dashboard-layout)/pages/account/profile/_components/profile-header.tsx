"use client"

import _Image from "next/image"
import Link from "next/link"
import { useSession } from "@/providers/auth-provider"
import { UserPen } from "lucide-react"

import type { LocaleType } from "@/types"

import { ensureLocalizedPathname } from "@/lib/i18n"
import {
  formatNumberToCompact as _formatNumberToCompact,
  cn,
  getInitials,
} from "@/lib/utils"

import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"

export function ProfileHeader({ locale }: { locale: LocaleType }) {
  const { data: session } = useSession()
  const user = session?.user

  return (
    <section className="bg-background border-y border-border">
      <AspectRatio ratio={5 / 1} className="bg-muted" />
      <div className="relative w-full flex flex-col items-center gap-2 p-4 md:flex-row">
        <Avatar className="size-32 -mt-20 md:size-40">
          <AvatarImage
            src={user?.avatar ?? undefined}
            alt="Profile Avatar"
            className="border-4 border-background"
          />
          <AvatarFallback className="border-4 border-background text-3xl">
            {user?.name ? getInitials(user.name) : "?"}
          </AvatarFallback>
        </Avatar>
        <Link
          href={ensureLocalizedPathname("/pages/account/settings", locale)}
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "absolute top-4 end-4"
          )}
          aria-label="Edit your profile"
        >
          <UserPen className="size-4" />
        </Link>
        <div className="text-center md:text-start">
          <div>
            <h1 className="text-2xl font-bold line-clamp-1">
              {user?.name || user?.email || "User"}
            </h1>
            <p className="text-muted-foreground line-clamp-1">{user?.email}</p>
          </div>
          <div className="inline-flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              {user?.role || "user"}
            </Badge>
          </div>
        </div>
      </div>
    </section>
  )
}
