"use client"

import { useCallback } from "react"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { Earth } from "lucide-react"

import type { DictionaryType } from "@/lib/get-dictionary"
import type { LocaleType } from "@/types"

import { i18n } from "@/configs/i18n"
import { relocalizePathname } from "@/lib/i18n"

import { useSettings } from "@/hooks/use-settings"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function LanguageDropdown({
  dictionary,
}: {
  dictionary: DictionaryType
}) {
  const pathname = usePathname()
  const params = useParams()
  const { settings, updateSettings } = useSettings()

  const locale = params["lang"] as LocaleType
  const direction = i18n.localeDirection[locale]

  const setLocale = useCallback(
    (localeName: LocaleType) => {
      updateSettings({ ...settings, locale: localeName })
    },
    [settings, updateSettings]
  )

  return (
    <DropdownMenu dir={direction}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Language">
          <Earth className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>
          {dictionary.navigation.language.language}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={locale}>
          {i18n.locales.map((loc) => {
            // Use locale code directly as dictionary key (en, es, etc.)
            const localizedLocaleName =
              dictionary.navigation.language[
                loc as keyof typeof dictionary.navigation.language
              ] || i18n.localeNames[loc]

            return (
              <Link
                key={loc}
                href={relocalizePathname(pathname, loc)}
                onClick={() => setLocale(loc)}
              >
                <DropdownMenuRadioItem value={loc}>
                  {localizedLocaleName}
                </DropdownMenuRadioItem>
              </Link>
            )
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
