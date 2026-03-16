"use client"

import { useCallback, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useSession } from "@/providers/auth-provider"
import {
  Book,
  Bot,
  Building2,
  CheckCircle2,
  Cloud,
  Coins,
  Database,
  AlertCircle,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileUp,
  FolderOpen,
  FolderTree,
  FlaskConical,
  ChevronLeft,
  Hash,
  Trash2,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Server,
  Upload,
  X,
} from "lucide-react"

import type {
  Agent,
  Collection,
  Department,
  Document,
  IntegrationScope,
  SearchResponse,
} from "@/lib/api"

import { api } from "@/lib/api"

import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { WorkspaceFileViewer } from "@/components/workspace-file-viewer"
import { CreateCollectionDialog } from "./_components/create-collection-dialog"
import { DatasetsTab, MCPServersTab } from "./_components/datasets-tab"

// Supported file types
const SUPPORTED_FILES: Record<string, { ext: string; icon: typeof FileText }> = {
  "application/pdf": { ext: "PDF", icon: FileText },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { ext: "DOCX", icon: FileText },
  "application/msword": { ext: "DOC", icon: FileText },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": { ext: "PPTX", icon: FileText },
  "text/plain": { ext: "TXT", icon: FileText },
  "text/markdown": { ext: "MD", icon: FileText },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { ext: "XLSX", icon: FileSpreadsheet },
  "text/csv": { ext: "CSV", icon: FileSpreadsheet },
  "image/png": { ext: "PNG", icon: FileImage },
  "image/jpeg": { ext: "JPG", icon: FileImage },
  "image/webp": { ext: "WEBP", icon: FileImage },
  "image/gif": { ext: "GIF", icon: FileImage },
}

const SCOPE_CONFIG: Record<
  IntegrationScope,
  { icon: React.ReactNode; color: string; label: string; description: string }
> = {
  enterprise: {
    icon: <Building2 className="size-4" />,
    color: "data-[state=active]:bg-purple-100 data-[state=active]:text-purple-800",
    label: "Enterprise",
    description: "Shared across all departments and agents",
  },
  department: {
    icon: <FolderTree className="size-4" />,
    color: "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800",
    label: "Department",
    description: "Shared within a department",
  },
  agent: {
    icon: <Bot className="size-4" />,
    color: "data-[state=active]:bg-green-100 data-[state=active]:text-green-800",
    label: "Agent",
    description: "Specific to one agent",
  },
}

interface UploadedFile {
  file: File
  status: "pending" | "uploading" | "success" | "error"
  progress: number
  error?: string
}

export default function KnowledgePage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [mainTab, setMainTab] = useState("documents")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [scope, setScope] = useState<IntegrationScope>("enterprise")
  const [selectedDepartment, setSelectedDepartment] = useState<string>("")
  const [selectedAgent, setSelectedAgent] = useState<string>("")
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)
  const [viewingFile, setViewingFile] = useState<{
    url: string; name: string; previewUrl: string;
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const enterpriseId = session?.user?.enterprise_id || ""

  const { data: departments } = useQuery({
    queryKey: ["departments", enterpriseId],
    queryFn: () => api.getDepartments(enterpriseId),
    enabled: !!enterpriseId,
  })

  const { data: agents } = useQuery({
    queryKey: ["agents", enterpriseId],
    queryFn: () => api.getAgents({ enterprise_id: enterpriseId }),
    enabled: !!enterpriseId,
  })

  // Drag & Drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    handleFilesSelected(files)
  }, [])

  const handleFilesSelected = (files: File[]) => {
    const validFiles = files.filter((file) => {
      const isSupported =
        Object.keys(SUPPORTED_FILES).includes(file.type) ||
        file.name.endsWith(".md") ||
        file.name.endsWith(".txt")
      if (!isSupported) {
        toast({ variant: "destructive", title: `Unsupported file: ${file.name}` })
      }
      return isSupported
    })
    const newFiles: UploadedFile[] = validFiles.map((file) => ({
      file,
      status: "pending",
      progress: 0,
    }))
    setUploadedFiles((prev) => [...prev, ...newFiles])
    setIsUploadOpen(true)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFilesSelected(Array.from(e.target.files))
    }
  }

  const removeUploadedFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // Fetch collections
  const {
    data: collections,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["knowledge", "collections", enterpriseId],
    queryFn: () => api.getCollections(enterpriseId),
    enabled: !!enterpriseId,
  })

  // Documents for selected collection
  const { data: collectionDocuments, isLoading: loadingDocs } = useQuery({
    queryKey: ["knowledge", "documents", enterpriseId, selectedCollectionId],
    queryFn: () => api.getCollectionDocuments(enterpriseId, selectedCollectionId!),
    enabled: !!enterpriseId && !!selectedCollectionId,
  })

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: (documentId: string) => api.deleteDocument(enterpriseId, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge", "documents", enterpriseId, selectedCollectionId] })
      queryClient.invalidateQueries({ queryKey: ["knowledge", "collections"] })
      toast({ title: "Document deleted" })
    },
    onError: () => toast({ variant: "destructive", title: "Failed to delete document" }),
  })

  // Search mutation
  const searchMutation = useMutation({
    mutationFn: (query: string) => api.searchKnowledge(enterpriseId, query),
    onSuccess: (data) => setSearchResults(data),
    onError: () => toast({ variant: "destructive", title: "Search failed" }),
  })

  const handleViewDocument = (doc: Document) => {
    const baseUrl = `/api/knowledge/documents/${doc.document_id}/file?enterprise_id=${enterpriseId}`
    const previewUrl = `/api/knowledge/documents/${doc.document_id}/preview?enterprise_id=${enterpriseId}`
    setViewingFile({
      url: baseUrl,
      name: doc.path || doc.title || doc.document_id,
      previewUrl,
    })
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setIsSearching(true)
    try {
      await searchMutation.mutateAsync(searchQuery)
    } finally {
      setIsSearching(false)
    }
  }

  // Calculate totals
  const totalChunks = collections?.reduce(
    (acc: number, c) => acc + ((c as unknown as { chunk_count: number }).chunk_count ?? 0), 0
  ) || 0
  const totalDocs = collections?.reduce((acc: number, c) => acc + (c.document_count ?? 0), 0) || 0
  const totalTokens = collections?.reduce(
    (acc: number, c) => acc + ((c as unknown as { total_tokens: number }).total_tokens ?? 0), 0
  ) || 0

  if (isLoading) {
    return (
      <div className="container p-6 flex justify-center items-center h-64">
        <Loader2 className="size-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Book className="size-6" />
            Knowledge
          </h1>
          <p className="text-muted-foreground">
            Documents and knowledge base for your agents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="size-4" />
          </Button>
          {mainTab === "documents" && !selectedCollectionId && (
            <CreateCollectionDialog
              enterpriseId={enterpriseId}
              departments={departments}
              agents={agents}
            />
          )}
          {mainTab === "documents" && selectedCollectionId && (
            <Button onClick={() => setIsUploadOpen(true)}>
              <Plus className="mr-2 size-4" />
              Add Knowledge
            </Button>
          )}
        </div>
      </div>

      {/* Main Tabs: Documents only (Datasets & MCP Servers disabled for now) */}
      <Tabs value={mainTab} onValueChange={setMainTab}>
        {/* <TabsList>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="size-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="datasets" className="gap-2">
            <FlaskConical className="size-4" />
            Datasets
          </TabsTrigger>
          <TabsTrigger value="mcp" className="gap-2">
            <Server className="size-4" />
            MCP Servers
          </TabsTrigger>
        </TabsList> */}

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6 mt-4">
          {/* Scope filter (disabled — enterprise-only for now)
          <Tabs value={scope} onValueChange={(v) => setScope(v as IntegrationScope)}>
            <TabsList>
              {Object.entries(SCOPE_CONFIG).map(([key, config]) => (
                <TabsTrigger key={key} value={key} className={`gap-2 ${config.color}`}>
                  {config.icon}
                  {config.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {scope === "department" && (
            <div className="flex items-center gap-4">
              <Label className="text-sm text-muted-foreground">Department:</Label>
              <select
                className="flex h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                <option value="">All Departments</option>
                {departments?.items?.map((dept: Department) => (
                  <option key={dept.id} value={dept.id}>{dept.display_name || dept.name}</option>
                ))}
              </select>
            </div>
          )}

          {scope === "agent" && (
            <div className="flex items-center gap-4">
              <Label className="text-sm text-muted-foreground">Agent:</Label>
              <select
                className="flex h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
              >
                <option value="">All Agents</option>
                {agents?.items?.map((agent: Agent) => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </select>
            </div>
          )}
          */}

          {/* Drag & Drop Zone (disabled — use Upload Files button instead)
          <Card
            className={`border-2 border-dashed transition-colors ${
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <CardContent className="flex flex-col items-center justify-center py-10">
              <Cloud className={`size-12 mb-4 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
              <p className="text-lg font-medium mb-1">
                {isDragging ? "Drop files here" : "Drag & Drop files to upload"}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Supports PDF, DOCX, TXT, MD, XLSX, CSV, PNG, JPG
              </p>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <FolderOpen className="mr-2 size-4" />
                Browse Files
              </Button>
            </CardContent>
          </Card>
          */}

          {/* Collections + Documents */}
          <Card>
            <CardHeader>
              {selectedCollectionId ? (
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" onClick={() => setSelectedCollectionId(null)}>
                    <ChevronLeft className="size-4" />
                  </Button>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Database className="size-4" />
                      {collections?.find((c) => (c.collection_id || c.id) === selectedCollectionId)?.name || selectedCollectionId}
                    </CardTitle>
                    <CardDescription>Documents in this collection</CardDescription>
                  </div>
                </div>
              ) : (
                <>
                  <CardTitle className="text-lg">Collections</CardTitle>
                  <CardDescription>Click a collection to view its documents</CardDescription>
                </>
              )}
            </CardHeader>
            <CardContent>
              {selectedCollectionId ? (
                /* Document list for selected collection */
                loadingDocs ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="size-6 animate-spin" />
                  </div>
                ) : !collectionDocuments || collectionDocuments.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto size-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground mb-4">No documents in this collection</p>
                    <Button onClick={() => setIsUploadOpen(true)}>
                      <Upload className="mr-2 size-4" />
                      Upload Files
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {collectionDocuments.map((doc: Document) => {
                      const ext = doc.title?.split(".").pop()?.toUpperCase() || ""
                      const isImage = ["PNG", "JPG", "JPEG"].includes(ext)
                      const isSpreadsheet = ["XLSX", "CSV"].includes(ext)
                      const Icon = isImage ? FileImage : isSpreadsheet ? FileSpreadsheet : FileText
                      return (
                        <div
                          key={doc.document_id}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleViewDocument(doc)}
                        >
                          <Icon className="size-8 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {doc.title || doc.source || doc.document_id}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              <span>{doc.chunk_count} chunks</span>
                              <span>{doc.total_tokens.toLocaleString()} tokens</span>
                              {doc.created_at && (
                                <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                          {ext && (
                            <Badge variant="outline" className="text-[10px] shrink-0">
                              {ext}
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 text-destructive hover:text-destructive"
                            onClick={(e) => { e.stopPropagation(); deleteDocumentMutation.mutate(doc.document_id) }}
                            disabled={deleteDocumentMutation.isPending}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )
              ) : !collections || collections.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="mx-auto size-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground mb-4">No collections yet</p>
                  <CreateCollectionDialog
                    enterpriseId={enterpriseId}
                    departments={departments}
                    agents={agents}
                  />
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {collections.map((collection) => {
                    const col = collection as unknown as {
                      collection_id: string
                      document_count: number
                      chunk_count: number
                      total_tokens: number
                    }
                    const colId = col.collection_id || collection.id
                    const scopeLabel = (collection as Collection).scope || "enterprise"
                    const deptId = (collection as Collection).department_id
                    const deptName = deptId
                      ? departments?.items?.find((d: Department) => d.id === deptId)?.display_name
                        || departments?.items?.find((d: Department) => d.id === deptId)?.name
                        || deptId
                      : null
                    return (
                      <Card
                        key={colId}
                        className="cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => setSelectedCollectionId(colId)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Database className="size-4" />
                              {collection.name || col.collection_id}
                            </CardTitle>
                            <Badge variant="outline" className="text-[10px]">
                              {scopeLabel === "enterprise" && <Building2 className="size-3 mr-1" />}
                              {scopeLabel === "department" && <FolderTree className="size-3 mr-1" />}
                              {scopeLabel === "agent" && <Bot className="size-3 mr-1" />}
                              {scopeLabel}
                            </Badge>
                          </div>
                          {deptName && (
                            <p className="text-xs text-muted-foreground">{deptName}</p>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <FileText className="size-3" /> Documents
                              </span>
                              <span>{col.document_count}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <Hash className="size-3" /> Chunks
                              </span>
                              <span>{col.chunk_count}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <Coins className="size-3" /> Tokens
                              </span>
                              <span>{col.total_tokens.toLocaleString()}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Datasets Tab */}
        <TabsContent value="datasets" className="mt-4">
          <DatasetsTab enterpriseId={enterpriseId} />
        </TabsContent>

        {/* MCP Servers Tab */}
        <TabsContent value="mcp" className="mt-4">
          <MCPServersTab enterpriseId={enterpriseId} />
        </TabsContent>
      </Tabs>

      {/* Document File Viewer */}
      {viewingFile && (
        <WorkspaceFileViewer
          open={!!viewingFile}
          onOpenChange={(open) => { if (!open) setViewingFile(null) }}
          fileUrl={viewingFile.url}
          fileName={viewingFile.name}
          previewUrl={viewingFile.previewUrl}
        />
      )}

      {/* Upload Dialog */}
      <UploadDocumentDialog
        open={isUploadOpen}
        onOpenChange={(open) => {
          setIsUploadOpen(open)
          if (!open) setUploadedFiles([])
        }}
        enterpriseId={enterpriseId}
        collections={collections || []}
        departments={departments}
        agents={agents}
        uploadedFiles={uploadedFiles}
        onRemoveFile={removeUploadedFile}
        defaultCollectionId={selectedCollectionId}
      />
    </div>
  )
}

function UploadDocumentDialog({
  open,
  onOpenChange,
  enterpriseId,
  collections,
  departments,
  agents,
  uploadedFiles = [],
  onRemoveFile: _onRemoveFile,
  defaultCollectionId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  enterpriseId: string
  collections: Collection[]
  departments?: { items: Department[] }
  agents?: { items: Agent[] }
  uploadedFiles?: UploadedFile[]
  onRemoveFile?: (index: number) => void
  defaultCollectionId?: string | null
}) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState(uploadedFiles.length > 0 ? "files" : "files")
  const [formData, setFormData] = useState({
    collection_id: defaultCollectionId || collections[0]?.collection_id || "default",
    title: "",
    content: "",
  })
  const [urlInput, setUrlInput] = useState("")
  const [localFiles, setLocalFiles] = useState<UploadedFile[]>(uploadedFiles)

  const collectionId = defaultCollectionId || formData.collection_id

  const handleSubmitText = async () => {
    if (!formData.content.trim()) {
      toast({ variant: "destructive", title: "Content is required" })
      return
    }
    setIsSubmitting(true)
    try {
      const result = await api.ingestDocument(enterpriseId, {
        collection_id: collectionId,
        content: formData.content,
        metadata: formData.title ? { title: formData.title } : undefined,
      })
      const ingestResult = result as unknown as { chunks_created: number; tokens_total: number }
      queryClient.invalidateQueries({ queryKey: ["knowledge"] })
      toast({
        title: "Document ingested",
        description: `Created ${ingestResult.chunks_created} chunks (${ingestResult.tokens_total} tokens)`,
      })
      onOpenChange(false)
      setFormData({ collection_id: "default", title: "", content: "" })
    } catch {
      toast({ variant: "destructive", title: "Failed to ingest document" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitUrl = async () => {
    if (!urlInput.trim()) {
      toast({ variant: "destructive", title: "URL is required" })
      return
    }
    setIsSubmitting(true)
    try {
      const result = await api.ingestFromUrl(enterpriseId, {
        collection_id: collectionId,
        url: urlInput.trim(),
      })
      const ingestResult = result as unknown as { chunks_created: number; tokens_total: number }
      queryClient.invalidateQueries({ queryKey: ["knowledge"] })
      toast({
        title: "URL ingested",
        description: `Created ${ingestResult.chunks_created} chunks (${ingestResult.tokens_total} tokens)`,
      })
      onOpenChange(false)
      setUrlInput("")
    } catch {
      toast({ variant: "destructive", title: "Failed to ingest URL" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUploadFiles = async () => {
    if (localFiles.length === 0) return
    setIsSubmitting(true)
    setLocalFiles((prev) => prev.map((f) => ({ ...f, status: "uploading" as const, progress: 0 })))

    for (let i = 0; i < localFiles.length; i++) {
      const uploadFile = localFiles[i]
      if (!uploadFile) continue
      try {
        await api.ingestFile(
          enterpriseId,
          uploadFile.file,
          collectionId,
          (progress) => {
            setLocalFiles((prev) =>
              prev.map((f, idx) => (idx === i ? { ...f, progress } : f))
            )
          }
        )
        setLocalFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: "success" as const, progress: 100 } : f))
        )
      } catch {
        setLocalFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: "error" as const, error: "Upload failed" } : f))
        )
      }
    }

    queryClient.invalidateQueries({ queryKey: ["knowledge"] })
    toast({ title: "Files uploaded" })
    setIsSubmitting(false)
  }

  const handleLocalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        file, status: "pending" as const, progress: 0,
      }))
      setLocalFiles((prev) => [...prev, ...newFiles])
    }
  }

  const removeLocalFile = (index: number) => {
    setLocalFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="size-5" />
            Add Knowledge
          </DialogTitle>
          <DialogDescription>
            Upload files, images, paste text, or import from URL.
            {" "}Text documents are chunked and indexed for RAG. Images are stored as reference files.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="files" className="flex items-center gap-2">
              <File className="size-4" /> Files
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center gap-2">
              <FileText className="size-4" /> Text
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Link2 className="size-4" /> URL
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 space-y-4">
            {/* Collection selector — only when NOT inside a collection */}
            {!defaultCollectionId && (
              <div className="space-y-2">
                <Label htmlFor="collection">Collection</Label>
                <Input
                  id="collection"
                  placeholder="default"
                  value={formData.collection_id}
                  onChange={(e) => setFormData({ ...formData, collection_id: e.target.value })}
                />
              </div>
            )}

            <TabsContent value="files" className="mt-0 space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.txt,.md,.xlsx,.csv,.png,.jpg,.jpeg,.webp,.gif,.pptx"
                className="hidden"
                onChange={handleLocalFileSelect}
              />
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="size-10 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium">Click or drag files here</p>
                <p className="text-sm text-muted-foreground">
                  PDF, DOCX, XLSX, PPTX, TXT, MD, CSV, PNG, JPG, WebP
                </p>
              </div>

              {localFiles.length > 0 && (
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {localFiles.map((uploadFile, index) => {
                      const fileType = SUPPORTED_FILES[uploadFile.file.type as keyof typeof SUPPORTED_FILES]
                      const Icon = fileType?.icon || File
                      return (
                        <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                          <Icon className="size-8 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{uploadFile.file.name}</p>
                            <p className="text-xs text-muted-foreground">{(uploadFile.file.size / 1024).toFixed(1)} KB</p>
                            {uploadFile.status === "uploading" && <Progress value={uploadFile.progress} className="h-1 mt-1" />}
                          </div>
                          <div className="flex items-center gap-2">
                            {uploadFile.status === "success" && <CheckCircle2 className="size-5 text-green-600" />}
                            {uploadFile.status === "error" && <AlertCircle className="size-5 text-red-600" />}
                            {uploadFile.status === "uploading" && <Loader2 className="size-5 animate-spin" />}
                            {uploadFile.status === "pending" && (
                              <Button variant="ghost" size="icon" onClick={() => removeLocalFile(index)}>
                                <X className="size-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="text" className="mt-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title (optional)</Label>
                <Input
                  id="title"
                  placeholder="e.g., Company Policies 2024"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Paste or type your document content here..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">{formData.content.length} characters</p>
              </div>
            </TabsContent>

            <TabsContent value="url" className="mt-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com/document"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Fetch and extract content from a web page</p>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={
              activeTab === "files" ? handleUploadFiles : activeTab === "url" ? handleSubmitUrl : handleSubmitText
            }
            disabled={
              isSubmitting ||
              (activeTab === "files" && localFiles.length === 0) ||
              (activeTab === "url" && !urlInput.trim()) ||
              (activeTab === "text" && !formData.content.trim())
            }
          >
            {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Upload className="mr-2 size-4" />}
            {activeTab === "files" ? `Upload ${localFiles.length} File${localFiles.length !== 1 ? "s" : ""}` : activeTab === "url" ? "Ingest URL" : "Ingest Content"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
