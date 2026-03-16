import Link from "next/link"
import { FaGithub, FaGoogle } from "react-icons/fa"

import { oauthLinksData } from "@/data/oauth-links"

import { buttonVariants } from "@/components/ui/button"

// Map icon names to actual icon components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  google: FaGoogle,
  github: FaGithub,
}

export function OAuthLinks() {
  // Filter to only show enabled OAuth providers
  const enabledLinks = oauthLinksData.filter((link) => link.enabled)

  if (enabledLinks.length === 0) {
    return null
  }

  return (
    <div className="flex justify-center gap-2">
      {enabledLinks.map((link) => {
        const IconComponent = iconMap[link.icon]
        return (
          <Link
            key={link.id}
            href={link.href}
            className={buttonVariants({ variant: "outline", size: "icon" })}
            aria-label={`Sign in with ${link.name}`}
          >
            {IconComponent && <IconComponent className="size-4" />}
          </Link>
        )
      })}
    </div>
  )
}
