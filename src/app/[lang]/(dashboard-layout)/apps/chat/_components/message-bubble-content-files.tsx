import { Download } from "lucide-react"

import type { MessageType } from "../types"

import { cn, formatFileSize } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { FileThumbnail } from "@/components/ui/file-thumbnail"

async function downloadFile(file: { name: string; url?: string }) {
  if (!file.url) return

  try {
    const { isTauriEnv, saveToDownloads, sendNotification } = await import("@/lib/tauri")
    if (isTauriEnv()) {
      const res = await fetch(file.url)
      const blob = await res.blob()
      const buffer = await blob.arrayBuffer()
      const result = await saveToDownloads(file.name, new Uint8Array(buffer))
      if (result) {
        await sendNotification(
          "Descarga completada",
          `${file.name} guardado en Descargas`
        )
        return
      }
    }
  } catch {
    // Not in Tauri or save failed — fall through to web download
  }

  const a = document.createElement("a")
  a.href = file.url
  a.download = file.name
  a.click()
}

export function MessageBubbleContentFiles({
  files,
  isByCurrentUser,
}: {
  files: MessageType["files"]
  isByCurrentUser: boolean
}) {
  if (!files || !files.length) return null // Return null if the files are empty

  return files.map((file) => (
    <div
      key={file.id}
      className={cn(
        "flex justify-between items-center bg-muted-foreground/20 p-4 rounded-lg break-all",
        isByCurrentUser && "bg-muted-foreground/40"
      )}
      aria-label="File"
    >
      <FileThumbnail fileName={file.name} />
      <div className="flex-1 grid mx-2 truncate">
        <span className="truncate">{file.name}</span>
        <span className="text-xs text-muted-foreground font-semibold truncate">
          {formatFileSize(file.size)}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Download"
        onClick={() => downloadFile(file)}
      >
        <Download className="size-4" />
      </Button>
    </div>
  ))
}
