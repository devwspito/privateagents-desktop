"use client"

import { useState } from "react"
import { Plug } from "lucide-react"

import { cn } from "@/lib/utils"

interface AppLogoProps {
  appName: string
  appKey: string
  logoUrl?: string | null
  size?: "sm" | "md" | "lg"
  className?: string
  iconClassName?: string
}

const sizeConfig = {
  sm: {
    container: "size-10",
    icon: 32,
    text: "text-lg",
    fallbackIcon: "size-4",
  },
  md: {
    container: "size-12",
    icon: 40,
    text: "text-xl",
    fallbackIcon: "size-5",
  },
  lg: {
    container: "size-16",
    icon: 56,
    text: "text-3xl",
    fallbackIcon: "size-6",
  },
}

export function AppLogo({
  appName,
  appKey,
  logoUrl,
  size = "md",
  className,
  iconClassName,
}: AppLogoProps) {
  const [imageError, setImageError] = useState(false)

  const config = sizeConfig[size]
  const safeName = appName || appKey || ""

  // Primary: use provided URL, fallback: Composio logo service (only if appKey exists)
  const src = logoUrl || (appKey ? `https://logos.composio.dev/api/${appKey}` : null)

  const initials = safeName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  if (imageError || !src) {
    return (
      <div
        className={cn(
          "flex-shrink-0 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden border",
          config.container,
          className
        )}
      >
        <span className={cn("font-bold text-gray-500", config.text)}>
          {initials || (
            <Plug className={cn("text-gray-400", config.fallbackIcon)} />
          )}
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex-shrink-0 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border relative",
        config.container,
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={appName}
        width={config.icon}
        height={config.icon}
        className={cn("object-contain", iconClassName)}
        onError={() => setImageError(true)}
        loading="lazy"
      />
    </div>
  )
}
