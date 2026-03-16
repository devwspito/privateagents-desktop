import type { DictionaryType } from "@/lib/get-dictionary"
import type { ReactNode } from "react"

import { Footer } from "../footer"
import { Sidebar } from "../sidebar"
import { HorizontalLayoutHeader } from "./horizontal-layout-header"

export function HorizontalLayout({
  children,
  dictionary,
}: {
  children: ReactNode
  dictionary: DictionaryType
}) {
  return (
    <>
      <Sidebar dictionary={dictionary} />
      <div className="w-full h-screen flex flex-col overflow-hidden">
        <HorizontalLayoutHeader dictionary={dictionary} />
        <main className="flex-1 flex flex-col bg-muted/40 overflow-auto min-h-0">
          {children}
        </main>
        <Footer />
      </div>
    </>
  )
}
