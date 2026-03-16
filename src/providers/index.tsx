import type { DirectionType, LocaleType } from "@/types"
import type { ReactNode } from "react"

import { SettingsProvider } from "@/contexts/settings-context"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AuthProvider } from "./auth-provider"
import { DirectionProvider } from "./direction-provider"
import { ErrorCaptureProvider } from "./error-capture-provider"
import { ModeProvider } from "./mode-provider"
import { QueryProvider } from "./query-provider"
import { ThemeProvider } from "./theme-provider"

export function Providers({
  locale,
  direction,
  children,
}: Readonly<{
  locale: LocaleType
  direction: DirectionType
  children: ReactNode
}>) {
  return (
    <SettingsProvider locale={locale}>
      <ModeProvider>
        <ThemeProvider>
          <DirectionProvider direction={direction}>
            <ErrorCaptureProvider>
              <AuthProvider>
                <QueryProvider>
                  <SidebarProvider>{children}</SidebarProvider>
                </QueryProvider>
              </AuthProvider>
            </ErrorCaptureProvider>
          </DirectionProvider>
        </ThemeProvider>
      </ModeProvider>
    </SettingsProvider>
  )
}
