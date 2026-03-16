"use client"

import type { DictionaryType } from "@/lib/get-dictionary"
import type { ReactNode } from "react"

import { useIsVertical } from "@/hooks/use-is-vertical"
import { useEventInvalidation } from "@/hooks/use-event-invalidation"
import { useUnifiedEvents } from "@/hooks/use-unified-events"
import { useDesktopBridge } from "@/hooks/use-desktop-bridge"
import { useEventStore } from "@/lib/stores/event-store"
import { HorizontalLayout } from "./horizontal-layout"
import { VerticalLayout } from "./vertical-layout"
import { SseErrorBanner } from "./sse-error-banner"

export function Layout({
  children,
  dictionary,
}: {
  children: ReactNode
  dictionary: DictionaryType
}) {
  const isVertical = useIsVertical()
  useUnifiedEvents()
  useEventInvalidation()
  useDesktopBridge()
  const sseError = useEventStore((s) => s.sseError)

  return (
    <>
      {sseError && <SseErrorBanner message={sseError} />}
      {isVertical ? (
        <VerticalLayout dictionary={dictionary}>{children}</VerticalLayout>
      ) : (
        <HorizontalLayout dictionary={dictionary}>{children}</HorizontalLayout>
      )}
    </>
  )
}
