"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Code2, Download, Eye, FileText, Loader2, RefreshCw } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CodeBlock } from "@/components/ui/code-block"
import { fetchWithAuth } from "@/lib/fetch-with-auth"
import { isTauriEnv } from "@/lib/tauri"

// ---------------------------------------------------------------------------
// File type detection
// ---------------------------------------------------------------------------

const CODE_EXTENSIONS: Record<string, string> = {
  css: "css",
  js: "javascript",
  jsx: "jsx",
  ts: "typescript",
  tsx: "tsx",
  html: "html",
  json: "json",
  py: "python",
  yaml: "yaml",
  yml: "yaml",
  xml: "xml",
  sql: "sql",
  sh: "bash",
  bash: "bash",
  txt: "text",
  env: "text",
  toml: "toml",
  ini: "ini",
  csv: "csv",
  graphql: "graphql",
  rs: "rust",
  go: "go",
  java: "java",
  rb: "ruby",
  php: "php",
  swift: "swift",
  kt: "kotlin",
  c: "c",
  cpp: "cpp",
  h: "c",
}

const IMAGE_EXTENSIONS = new Set([
  "png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico",
])

const DOCUMENT_EXTENSIONS = new Set([
  "docx", "doc", "pptx", "ppt", "xlsx", "xls",
])

function getExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".")
  return dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : ""
}

function getFileCategory(ext: string): "code" | "markdown" | "image" | "html" | "pdf" | "document" | "binary" {
  if (ext === "md" || ext === "mdx") return "markdown"
  if (ext === "html" || ext === "htm") return "html"
  if (ext === "pdf") return "pdf"
  if (DOCUMENT_EXTENSIONS.has(ext)) return "document"
  if (IMAGE_EXTENSIONS.has(ext)) return "image"
  if (ext in CODE_EXTENSIONS) return "code"
  return "binary"
}

// Max text size to render (512KB)
const MAX_TEXT_RENDER = 512 * 1024

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type ViewerState =
  | { status: "loading" }
  | { status: "loaded"; content: string; blobUrl: string; contentType: string }
  | { status: "loaded-image"; blobUrl: string }
  | { status: "loaded-pdf"; blobUrl: string }
  | { status: "error"; message: string }

export function WorkspaceFileViewer({
  open,
  onOpenChange,
  fileUrl,
  fileName,
  previewUrl,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  fileUrl: string
  fileName: string
  previewUrl?: string
}) {
  const [state, setState] = useState<ViewerState>({ status: "loading" })
  const [truncated, setTruncated] = useState(false)
  const [htmlView, setHtmlView] = useState<"preview" | "code">("preview")
  const blobUrlRef = useRef<string | null>(null)
  const downloadUrlRef = useRef<string | null>(null)

  const cleanup = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
    if (downloadUrlRef.current) {
      URL.revokeObjectURL(downloadUrlRef.current)
      downloadUrlRef.current = null
    }
  }, [])

  const fetchFile = useCallback(async () => {
    setState({ status: "loading" })
    setTruncated(false)
    cleanup()

    try {
      const ext = getExtension(fileName)
      const category = getFileCategory(ext)

      // For documents (docx/pptx/xlsx) and PDFs in Tauri, fetch HTML preview from backend
      const isDocument = DOCUMENT_EXTENSIONS.has(ext)
      const isPdfInTauri = ext === "pdf" && isTauriEnv()
      const usePreview = isDocument || isPdfInTauri
      const fetchUrl = usePreview
        ? (previewUrl || fileUrl.replace("/workspace/files/", "/workspace/preview/"))
        : fileUrl

      const response = await fetchWithAuth(fetchUrl)
      if (!response.ok) {
        setState({ status: "error", message: `Error ${response.status}: ${response.statusText}` })
        return
      }

      const contentType = response.headers.get("content-type") || ""

      // PDF: load blob and display in native browser viewer (web only)
      if (category === "pdf" && !isPdfInTauri) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        blobUrlRef.current = url
        setState({ status: "loaded-pdf", blobUrl: url })
        return
      }

      // Document / PDF-in-Tauri preview: backend returns HTML
      if (usePreview) {
        const html = await response.text()
        // Also fetch original file for download button
        fetchWithAuth(fileUrl).then(async (r) => {
          if (r.ok) {
            const blob = await r.blob()
            downloadUrlRef.current = URL.createObjectURL(blob)
          }
        }).catch(() => {})
        setState({ status: "loaded", content: html, blobUrl: "", contentType: "text/html" })
        return
      }

      if (category === "image" || contentType.startsWith("image/")) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        blobUrlRef.current = url
        setState({ status: "loaded-image", blobUrl: url })
        return
      }

      if (category === "code" || category === "markdown" || category === "html") {
        const text = await response.text()
        const displayText = text.length > MAX_TEXT_RENDER
          ? text.slice(0, MAX_TEXT_RENDER)
          : text
        if (text.length > MAX_TEXT_RENDER) setTruncated(true)

        const blob = new Blob([text], { type: contentType || "text/plain" })
        const url = URL.createObjectURL(blob)
        blobUrlRef.current = url
        setState({ status: "loaded", content: displayText, blobUrl: url, contentType })
        return
      }

      // Binary / unknown — just offer download
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      blobUrlRef.current = url
      setState({ status: "loaded", content: "", blobUrl: url, contentType })
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Error loading file",
      })
    }
  }, [fileUrl, fileName, previewUrl, cleanup])

  useEffect(() => {
    if (open && fileUrl) {
      fetchFile()
    }
    return cleanup
  }, [open, fileUrl, fetchFile, cleanup])

  const handleDownload = async () => {
    // Determine which blob URL holds the original file
    const ext = getExtension(fileName)
    let targetBlobUrl: string | null = null

    if ((DOCUMENT_EXTENSIONS.has(ext) || ext === "pdf") && downloadUrlRef.current) {
      targetBlobUrl = downloadUrlRef.current
    } else if (state.status === "loaded-pdf") {
      targetBlobUrl = state.blobUrl
    } else if (state.status === "loaded" || state.status === "loaded-image") {
      targetBlobUrl = state.blobUrl
    }

    if (!targetBlobUrl) return

    // In Tauri, <a download> doesn't work — use native save command
    try {
      const { isTauriEnv, saveToDownloads, sendNotification } = await import("@/lib/tauri")
      if (isTauriEnv()) {
        const res = await fetch(targetBlobUrl)
        const blob = await res.blob()
        const buffer = await blob.arrayBuffer()
        const result = await saveToDownloads(fileName, new Uint8Array(buffer))
        if (result) {
          await sendNotification("Descarga completada", `${fileName} guardado en Descargas`)
          return
        }
      }
    } catch {
      // Not in Tauri or save failed — fall through to web download
    }

    const a = document.createElement("a")
    a.href = targetBlobUrl
    a.download = fileName
    a.click()
  }

  const ext = getExtension(fileName)
  const rawCategory = getFileCategory(ext)
  // In Tauri, PDFs are rendered as document previews (HTML) since the webview has no PDF viewer
  const category = (rawCategory === "pdf" && isTauriEnv()) ? "document" as const : rawCategory

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <div className="flex items-center gap-2 pe-8">
            <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
            <DialogTitle className="truncate text-base">{fileName}</DialogTitle>
            {(state.status === "loaded" || state.status === "loaded-image" || state.status === "loaded-pdf") && (
              <Button
                variant="outline"
                size="sm"
                className="ms-auto shrink-0"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 me-1.5" />
                Descargar
              </Button>
            )}
          </div>
          <DialogDescription className="sr-only">
            File viewer for {fileName}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 max-h-[70vh] overflow-auto rounded-lg">
          {state.status === "loading" && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {state.status === "error" && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-sm text-destructive">{state.message}</p>
              <Button variant="outline" size="sm" onClick={fetchFile}>
                <RefreshCw className="h-4 w-4 me-1.5" />
                Reintentar
              </Button>
            </div>
          )}

          {state.status === "loaded-image" && (
            <div className="flex items-center justify-center p-4">
              <img
                src={state.blobUrl}
                alt={fileName}
                className="max-h-[65vh] max-w-full rounded-lg object-contain"
              />
            </div>
          )}

          {state.status === "loaded-pdf" && (
            <iframe
              src={state.blobUrl}
              title={fileName}
              className="w-full border-0 rounded-lg"
              style={{ height: "70vh" }}
            />
          )}

          {state.status === "loaded" && category === "markdown" && state.content && (
            <div className="prose prose-sm dark:prose-invert max-w-none p-4">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {state.content}
              </ReactMarkdown>
            </div>
          )}

          {state.status === "loaded" && (category === "html" || category === "document") && state.content && (
            <div>
              {category === "html" && (
                <div className="flex items-center gap-1 border-b px-3 py-1.5">
                  <Button
                    variant={htmlView === "preview" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setHtmlView("preview")}
                  >
                    <Eye className="h-3.5 w-3.5 me-1" />
                    Preview
                  </Button>
                  <Button
                    variant={htmlView === "code" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setHtmlView("code")}
                  >
                    <Code2 className="h-3.5 w-3.5 me-1" />
                    Code
                  </Button>
                </div>
              )}
              {(category === "document" || htmlView === "preview") ? (
                <iframe
                  srcDoc={(() => {
                    if (category === "document") return state.content
                    // Inject <base> so relative CSS/JS/image paths resolve via workspace API
                    const dirUrl = fileUrl.substring(0, fileUrl.lastIndexOf("/") + 1)
                    const baseTag = `<base href="${dirUrl}">`
                    const html = state.content
                    // Insert after <head> if present, otherwise prepend
                    if (/<head[^>]*>/i.test(html)) {
                      return html.replace(/(<head[^>]*>)/i, `$1${baseTag}`)
                    }
                    return baseTag + html
                  })()}
                  title={fileName}
                  className="w-full border-0 rounded-b-lg bg-white"
                  style={{ height: "65vh" }}
                  sandbox="allow-same-origin"
                />
              ) : (
                <CodeBlock lang="html">{state.content}</CodeBlock>
              )}
            </div>
          )}

          {state.status === "loaded" && category === "code" && state.content && (
            <CodeBlock lang={CODE_EXTENSIONS[ext] || "text"}>
              {state.content}
            </CodeBlock>
          )}

          {state.status === "loaded" && !state.content && category === "binary" && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Este tipo de archivo no se puede previsualizar.
              </p>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 me-1.5" />
                Descargar {fileName}
              </Button>
            </div>
          )}

          {truncated && (
            <div className="border-t p-3 text-center text-xs text-muted-foreground">
              Archivo truncado (demasiado grande). Descarga para ver el contenido completo.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
