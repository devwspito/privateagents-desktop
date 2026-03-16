// More info: https://nextjs.org/docs/app/building-your-application/routing/internationalization#localization
import "server-only"

import type { LocaleType } from "@/types"

const dictionaries = {
  en: () =>
    import("@/data/dictionaries/en.json").then((module) => module.default),
  es: () =>
    import("@/data/dictionaries/es.json").then((module) => module.default),
}

export async function getDictionary(locale: LocaleType) {
  return dictionaries[locale]()
}

export type DictionaryType = Awaited<ReturnType<typeof getDictionary>>
