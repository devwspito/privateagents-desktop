"use client"

import { Children, useCallback, useMemo, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { FileText } from "lucide-react"

import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"
import { WorkspaceFileViewer } from "./workspace-file-viewer"

// ---------------------------------------------------------------------------
// @mention detection
// ---------------------------------------------------------------------------
const MENTION_RE = /(@[\w][\w.-]*[\w]|@[\w])/g

function renderTextWithMentions(text: string): ReactNode[] {
  const parts = text.split(MENTION_RE)
  return parts.map((part, i) => {
    if (MENTION_RE.test(part)) {
      // Reset lastIndex since we're using the same regex
      MENTION_RE.lastIndex = 0
      return (
        <Badge
          key={`m-${i}`}
          variant="secondary"
          className="mx-0.5 text-xs font-semibold cursor-default"
        >
          {part}
        </Badge>
      )
    }
    return part
  })
}

/**
 * Walk React children and replace plain-text nodes that contain @mentions
 * with Badge components, leaving other elements (code, links, etc.) intact.
 */
function processChildren(children: ReactNode): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child === "string") {
      if (MENTION_RE.test(child)) {
        MENTION_RE.lastIndex = 0
        return <>{renderTextWithMentions(child)}</>
      }
      return child
    }
    return child
  })
}

// ---------------------------------------------------------------------------
// Google Drive URL detection
// ---------------------------------------------------------------------------
const DRIVE_RE = /^https?:\/\/(drive\.google\.com|docs\.google\.com)\//

function isDriveUrl(href: string): boolean {
  return DRIVE_RE.test(href)
}

function DriveFileLink({
  href,
  children,
}: {
  href: string
  children: ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-1 text-sm text-primary hover:bg-muted transition-colors no-underline"
    >
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
        <path
          d="M8.267 14.68l-1.6 2.77a.5.5 0 00.433.75h9.8a.5.5 0 00.433-.75l-1.6-2.77H8.267z"
          fill="#4285F4"
        />
        <path
          d="M14.733 14.68l-4.6-7.97a.5.5 0 00-.866 0L4.4 14.68h3.867l2.6-4.5 2.6 4.5h1.266z"
          fill="#0F9D58"
        />
        <path
          d="M14.733 14.68h4.867l-4.867-8.44a.5.5 0 00-.433-.25h-.001a.5.5 0 00-.432.25l-1.6 2.77 2.466 4.27v1.4z"
          fill="#FBBC04"
        />
      </svg>
      <span className="truncate max-w-[200px]">{children}</span>
      <svg
        className="h-3 w-3 shrink-0 text-muted-foreground"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
        />
      </svg>
    </a>
  )
}

// ---------------------------------------------------------------------------
// Workspace file URL detection
// ---------------------------------------------------------------------------
const WORKSPACE_FILE_RE = /^\/api\/workspace\/files\//

function isWorkspaceFileUrl(href: string): boolean {
  return WORKSPACE_FILE_RE.test(href)
}

/** Detect relative workspace paths that agents write without the full API prefix */
const RELATIVE_WORKSPACE_RE = /^\.?\/?(?:output|deliverables)\//

function isRelativeWorkspacePath(href: string): boolean {
  return RELATIVE_WORKSPACE_RE.test(href)
}

function extractFileName(href: string): string {
  const segments = href.split("/")
  return segments[segments.length - 1] || "file"
}

/** Normalize a relative workspace path to an API URL */
function toWorkspaceUrl(href: string, agentId: string): string {
  const clean = href.replace(/^\.\//, "")
  return `/api/workspace/files/${agentId}/${clean}`
}

// ---------------------------------------------------------------------------
// Bare filename detection (e.g. "master-prl-template.html" without path prefix)
// ---------------------------------------------------------------------------
const WORKSPACE_FILE_EXT_RE =
  /^[\w][\w\-. ]*\.(html|htm|css|js|jsx|ts|tsx|json|md|mdx|csv|txt|py|yaml|yml|xml|sql|sh|toml|ini|graphql|rs|go|java|rb|php|swift|kt|c|cpp|h|png|jpg|jpeg|gif|webp|svg|bmp|pdf|docx|doc|pptx|ppt|xlsx|xls)$/i

function isWorkspaceFilename(text: string): boolean {
  return WORKSPACE_FILE_EXT_RE.test(text.trim())
}

// ---------------------------------------------------------------------------
// Image URL detection for inline preview
// ---------------------------------------------------------------------------
const IMAGE_EXT_RE = /\.(png|jpg|jpeg|gif|webp|svg|bmp)(\?.*)?$/i

function isImageUrl(href: string): boolean {
  try {
    const url = new URL(href)
    return IMAGE_EXT_RE.test(url.pathname)
  } catch {
    return IMAGE_EXT_RE.test(href)
  }
}

// ---------------------------------------------------------------------------
// Text preprocessor: detect bare workspace paths and convert to markdown links
// ---------------------------------------------------------------------------

/**
 * Matches bare workspace file paths in text and converts them to markdown links.
 * Detects patterns like:
 *   - output/reports/file.csv
 *   - ./output/landing-templates/
 *   - deliverables/task-name/file.html
 *   - /design-studio/agent/output/path/file.ext (absolute workspace paths)
 *
 * Avoids matching inside existing markdown links [text](url) or code blocks.
 */
const BARE_WORKSPACE_PATH_RE =
  /(?<!\]\()(?<!\()\b(\.?\/?)?(output|deliverables)(\/[\w\-./]+)/g

function preprocessWorkspacePaths(text: string): string {
  return text.replace(BARE_WORKSPACE_PATH_RE, (match, _prefix, _dir, _rest, offset) => {
    // Don't convert if already inside a markdown link: [...](HERE) or [...](
    // Check characters before the match for ]( pattern
    const before = text.slice(Math.max(0, offset - 10), offset)
    if (/\]\(\s*$/.test(before)) return match

    // Don't convert if inside a code fence (``` ... ```)
    const textBefore = text.slice(0, offset)
    const fenceCount = (textBefore.match(/```/g) || []).length
    if (fenceCount % 2 !== 0) return match

    // Don't convert if inside inline backticks — we handle those via the code component
    // Check if there's an unmatched backtick before us
    const backticksBefore = (textBefore.match(/(?<!`)`(?!`)/g) || []).length
    if (backticksBefore % 2 !== 0) return match

    // Clean up the path for display
    const cleanPath = match.replace(/^\.\//, "")
    const fileName = cleanPath.split("/").filter(Boolean).pop() || cleanPath
    return `[${fileName}](${cleanPath})`
  })
}

// ---------------------------------------------------------------------------
// Stable references for ReactMarkdown (avoid recreation on every render)
// ---------------------------------------------------------------------------
const REMARK_PLUGINS = [remarkGfm]

function buildMarkdownComponents(onOpenFile: (url: string, name: string) => void, agentId?: string) {
  return {
    p: ({ children }: { children: ReactNode }) => <p>{processChildren(children)}</p>,
    li: ({ children }: { children: ReactNode }) => <li>{processChildren(children)}</li>,
    td: ({ children }: { children: ReactNode }) => <td>{processChildren(children)}</td>,
    th: ({ children }: { children: ReactNode }) => <th>{processChildren(children)}</th>,
    strong: ({ children }: { children: ReactNode }) => {
      // Detect bold filenames like **master-prl-template.html**
      const text = typeof children === "string" ? children : ""
      if (agentId && text && isWorkspaceFilename(text)) {
        const fullUrl = `/api/workspace/files/${agentId}/${text.trim()}`
        return (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-1.5 py-0.5 text-xs font-semibold text-primary hover:bg-muted transition-colors cursor-pointer no-underline"
            onClick={() => onOpenFile(fullUrl, text.trim())}
          >
            <FileText className="h-3 w-3 shrink-0" />
            {text}
          </button>
        )
      }
      return <strong>{processChildren(children)}</strong>
    },
    em: ({ children }: { children: ReactNode }) => <em>{processChildren(children)}</em>,
    a: ({ href, children }: { href?: string; children: ReactNode }) => {
      if (!href) return <>{children}</>

      if (isDriveUrl(href)) {
        return <DriveFileLink href={href}>{children}</DriveFileLink>
      }

      // Full workspace URL: /api/workspace/files/...
      if (isWorkspaceFileUrl(href)) {
        return (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-1 text-sm text-primary hover:bg-muted transition-colors cursor-pointer no-underline"
            onClick={() => onOpenFile(href, extractFileName(href))}
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span className="truncate max-w-[200px]">{children}</span>
          </button>
        )
      }

      // Relative workspace path: output/... or deliverables/...
      if (agentId && isRelativeWorkspacePath(href)) {
        const fullUrl = toWorkspaceUrl(href, agentId)
        return (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-1 text-sm text-primary hover:bg-muted transition-colors cursor-pointer no-underline"
            onClick={() => onOpenFile(fullUrl, extractFileName(href))}
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span className="truncate max-w-[200px]">{children}</span>
          </button>
        )
      }

      if (isImageUrl(href)) {
        return (
          <a href={href} target="_blank" rel="noopener noreferrer" className="block my-2">
            <img
              src={href}
              alt={typeof children === "string" ? children : "Image"}
              className="rounded-lg max-h-[300px] object-contain"
              loading="lazy"
            />
          </a>
        )
      }

      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-4 hover:underline">
          {children}
        </a>
      )
    },
    // Inline code: detect workspace paths and bare filenames, make clickable
    code: ({ children, className }: { children: ReactNode; className?: string }) => {
      // Only handle inline code (no className = no language = not a code block)
      if (className) {
        return <code className={className}>{children}</code>
      }
      const text = typeof children === "string" ? children : ""
      if (agentId && text) {
        // Workspace path: output/... or deliverables/...
        if (RELATIVE_WORKSPACE_RE.test(text)) {
          const cleanPath = text.replace(/^\.\//, "").replace(/\/+$/, "")
          const fullUrl = `/api/workspace/files/${agentId}/${cleanPath}`
          const name = cleanPath.split("/").filter(Boolean).pop() || cleanPath
          return (
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-1.5 py-0.5 text-xs text-primary hover:bg-muted transition-colors cursor-pointer font-mono no-underline"
              onClick={() => onOpenFile(fullUrl, name)}
            >
              <FileText className="h-3 w-3 shrink-0" />
              {text}
            </button>
          )
        }
        // Bare filename: master-prl-template.html (search by name)
        if (isWorkspaceFilename(text)) {
          const fullUrl = `/api/workspace/files/${agentId}/${text.trim()}`
          return (
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-1.5 py-0.5 text-xs text-primary hover:bg-muted transition-colors cursor-pointer font-mono no-underline"
              onClick={() => onOpenFile(fullUrl, text.trim())}
            >
              <FileText className="h-3 w-3 shrink-0" />
              {text}
            </button>
          )
        }
      }
      return <code>{children}</code>
    },
    img: ({ src, alt }: { src?: string; alt?: string }) => (
      <img
        src={src}
        alt={alt || ""}
        className="rounded-lg max-h-[300px] object-contain my-2"
        loading="lazy"
      />
    ),
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function MessageBubbleContentText({
  text,
  isStreaming,
  isByCurrentUser,
  agentId,
}: {
  text: string
  isStreaming?: boolean
  isByCurrentUser?: boolean
  /** Agent ID for resolving relative workspace file paths (output/..., deliverables/...) */
  agentId?: string
}) {
  const [viewerFile, setViewerFile] = useState<{ url: string; name: string } | null>(null)

  const onOpenFile = useCallback((url: string, name: string) => {
    setViewerFile({ url, name })
  }, [])

  const components = useMemo(() => buildMarkdownComponents(onOpenFile, agentId), [onOpenFile, agentId])

  // Preprocess: convert bare workspace paths in text to markdown links
  const processedText = useMemo(() => {
    if (!agentId) return text
    return preprocessWorkspacePaths(text)
  }, [text, agentId])

  if (!text) return null

  return (
    <>
      <div
        className={cn(
          "prose prose-sm max-w-full min-w-0 w-full px-2 py-1 overflow-hidden",
          isByCurrentUser ? "prose-inherit" : "dark:prose-invert",
          "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
          "[&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1",
          "[&_pre]:my-2 [&_blockquote]:my-2",
          "[&_pre]:bg-black/10 dark:[&_pre]:bg-white/10 [&_pre]:rounded-lg [&_pre]:p-3",
          "[&_pre]:overflow-x-auto [&_pre]:!max-w-full [&_pre]:text-xs",
          "[&_:not(pre)>code]:bg-black/10 dark:[&_:not(pre)>code]:bg-white/10 [&_:not(pre)>code]:px-1",
          "[&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:rounded",
          "[&_:not(pre)>code]:text-xs [&_:not(pre)>code]:before:content-none",
          "[&_:not(pre)>code]:after:content-none",
          "[&_:not(pre)>code]:break-all",
          "[&_table]:text-xs [&_th]:px-2 [&_td]:px-2",
          "[&_a]:text-primary [&_a]:underline-offset-4"
        )}
      >
        <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={components}>
          {processedText}
        </ReactMarkdown>
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 ml-0.5 bg-foreground/60 animate-pulse rounded-sm align-text-bottom" />
        )}
      </div>

      {viewerFile && (
        <WorkspaceFileViewer
          open={!!viewerFile}
          onOpenChange={(open) => { if (!open) setViewerFile(null) }}
          fileUrl={viewerFile.url}
          fileName={viewerFile.name}
        />
      )}
    </>
  )
}
