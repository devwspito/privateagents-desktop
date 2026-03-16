import { Lato } from "next/font/google"

import { cn } from "@/lib/utils"

import "../globals.css"

import { Providers } from "@/providers"

import type { Metadata } from "next"
import type { ReactNode } from "react"

import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: "Remote Agent",
  description: "Control your desktop agent remotely",
}

const latoFont = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-lato",
})

export default function RemoteLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "font-lato bg-background text-foreground antialiased overscroll-none",
          latoFont.variable
        )}
      >
        <Providers locale="en" direction="ltr">
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
