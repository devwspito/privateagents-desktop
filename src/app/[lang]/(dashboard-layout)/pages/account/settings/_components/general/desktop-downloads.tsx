"use client"

import { useEffect, useState } from "react"
import { Download, ExternalLink, Monitor } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface ReleaseAsset {
  name: string
  download_url: string  // Our proxy URL
  size: number
}

interface PlatformConfig {
  name: string
  description: string
  variants: {
    label: string
    ext: string
    /** Pattern to match against GitHub release asset name */
    pattern: RegExp
  }[]
}

const platforms: PlatformConfig[] = [
  {
    name: "macOS",
    description: "Apple Silicon & Intel",
    variants: [
      {
        label: "Apple Silicon",
        ext: ".dmg",
        pattern: /aarch64\.dmg$/i,
      },
      {
        label: "Intel",
        ext: ".dmg",
        pattern: /x64\.dmg$/i,
      },
    ],
  },
  {
    name: "Windows",
    description: "Windows 10/11 (64-bit)",
    variants: [
      {
        label: "Installer",
        ext: ".exe",
        pattern: /x64[_-]setup\.exe$|x64\.nsis\.exe$/i,
      },
      {
        label: "Portable",
        ext: ".msi",
        pattern: /x64_en-US\.msi$/i,
      },
    ],
  },
  {
    name: "Linux",
    description: "Ubuntu, Fedora, Arch",
    variants: [
      {
        label: "AppImage",
        ext: ".AppImage",
        pattern: /amd64\.AppImage$/i,
      },
      {
        label: "Debian",
        ext: ".deb",
        pattern: /amd64\.deb$/i,
      },
    ],
  },
]

function formatSize(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`
}

export function DesktopDownloads() {
  const [assets, setAssets] = useState<ReleaseAsset[]>([])
  const [releaseUrl, setReleaseUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLatestRelease() {
      try {
        // Use relative URL - nginx will proxy to backend
        // This works both locally and in production
        const res = await fetch("/api/desktop/releases")
        if (!res.ok) {
          setLoading(false)
          return
        }
        const data = await res.json()
        setAssets(data.assets || [])
        setReleaseUrl(data.html_url || null)
      } catch {
        // No release available yet
      } finally {
        setLoading(false)
      }
    }
    fetchLatestRelease()
  }, [])

  function findAsset(pattern: RegExp): ReleaseAsset | undefined {
    return assets.find((a) => pattern.test(a.name))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="size-5" />
          Desktop App
        </CardTitle>
        <CardDescription>
          Install the desktop app for local tool execution, file access, and
          offline capabilities with your AI agent.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          {platforms.map((platform) => {
            const matchedVariants = platform.variants
              .map((v) => ({ ...v, asset: findAsset(v.pattern) }))
              .filter((v) => v.asset)

            return (
              <div
                key={platform.name}
                className="flex flex-col items-center gap-2 rounded-lg border p-4 text-center"
              >
                <div className="text-lg font-semibold">{platform.name}</div>
                <p className="text-xs text-muted-foreground">
                  {platform.description}
                </p>

                {loading ? (
                  <Badge variant="secondary" className="mt-2">
                    Checking...
                  </Badge>
                ) : matchedVariants.length > 0 ? (
                  <div className="mt-2 flex flex-col gap-2 w-full">
                    {matchedVariants.map((v) => (
                      <Button
                         key={v.label}
                         size="sm"
                         className="w-full"
                         asChild
                       >
                         <a
                           href={v.asset!.download_url}
                           download
                           rel="noopener noreferrer"
                         >
                           <Download className="size-4 mr-1" />
                           {v.label} ({v.ext})
                           <span className="ml-1 text-xs opacity-70">
                             {formatSize(v.asset!.size)}
                           </span>
                         </a>
                       </Button>
                    ))}
                  </div>
                ) : (
                  <Badge variant="secondary" className="mt-2">
                    Coming Soon
                  </Badge>
                )}
              </div>
            )
          })}
        </div>

        {releaseUrl && (
          <div className="mt-4 text-center">
            <Button variant="ghost" size="sm" asChild>
              <a href={releaseUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-3 mr-1" />
                View all releases on GitHub
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
