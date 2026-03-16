import type { DynamicIconNameType } from "@/types"

import { socialLinksData } from "@/data/social-links"

import { Button } from "@/components/ui/button"
import { DynamicIcon } from "@/components/dynamic-icon"

export function SocialMediaLinks() {
  return (
    <div className="flex justify-center gap-2">
      {socialLinksData.map(({ href, label, icon }) => (
        <Button key={label} variant="outline" size="icon" asChild>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
          >
            <DynamicIcon name={icon as DynamicIconNameType} className="size-4" />
          </a>
        </Button>
      ))}
    </div>
  )
}
