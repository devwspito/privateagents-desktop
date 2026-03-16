/**
 * API Client - Knowledge methods
 */

import type { BaseApiClient as _BaseApiClient } from "./base"
import type {
  Collection,
  CollectionCreateRequest,
  CollectionUpdateRequest,
  Document,
  IngestRequest,
  IngestResponse,
  IngestUrlRequest,
  ScopedSearchRequest,
  SearchResponse,
  SearchResponseDetailed,
  CollectionDetail as _CollectionDetail,
} from "./types"
import type { ApiClientConstructor } from "./utils"

export function withKnowledgeApi<TBase extends ApiClientConstructor>(
  Base: TBase
) {
  return class KnowledgeApi extends Base {
    async getCollections(enterpriseId: string) {
      return this.request<Collection[]>(
        `/knowledge/collections?enterprise_id=${enterpriseId}`
      )
    }

    async searchKnowledge(enterpriseId: string, query: string) {
      return this.request<SearchResponse>(
        `/knowledge/search?enterprise_id=${enterpriseId}`,
        {
          method: "POST",
          body: JSON.stringify({ query }),
        }
      )
    }

    async ingestDocument(enterpriseId: string, data: IngestRequest) {
      return this.request<IngestResponse>(
        `/knowledge/ingest/text?enterprise_id=${enterpriseId}`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      )
    }

    async ingestFromUrl(enterpriseId: string, data: IngestUrlRequest) {
      return this.request<IngestResponse>(
        `/knowledge/ingest/url?enterprise_id=${enterpriseId}`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      )
    }

    async ingestFile(
      enterpriseId: string,
      file: File,
      collectionId?: string,
      onProgress?: (progress: number) => void
    ) {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("enterprise_id", enterpriseId)
      if (collectionId) formData.append("collection_id", collectionId)

      const xhr = new XMLHttpRequest()
      return new Promise<IngestResponse>((resolve, reject) => {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && onProgress) {
            onProgress(Math.round((e.loaded / e.total) * 100))
          }
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText))
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`))
          }
        }
        xhr.onerror = () => reject(new Error("Upload failed"))
        xhr.open(
          "POST",
          `${this.baseUrl}/knowledge/ingest/file`
        )
        if (this.getToken()) {
          xhr.setRequestHeader("Authorization", `Bearer ${this.getToken()}`)
        }
        xhr.send(formData)
      })
    }

    async searchKnowledgeScoped(
      enterpriseId: string,
      data: ScopedSearchRequest
    ) {
      return this.request<SearchResponseDetailed>(
        `/knowledge/search/scoped?enterprise_id=${enterpriseId}`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      )
    }

    async getEffectiveCollections(enterpriseId: string, agentId: string) {
      return this.request<Collection[]>(
        `/knowledge/collections/effective/${agentId}?enterprise_id=${enterpriseId}`
      )
    }

    async createCollection(
      enterpriseId: string,
      data: CollectionCreateRequest
    ) {
      return this.request<Collection>(
        `/knowledge/collections?enterprise_id=${enterpriseId}`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      )
    }

    async updateCollection(
      enterpriseId: string,
      collectionId: string,
      data: CollectionUpdateRequest
    ) {
      return this.request<Collection>(
        `/knowledge/collections/${collectionId}?enterprise_id=${enterpriseId}`,
        {
          method: "PATCH",
          body: JSON.stringify(data),
        }
      )
    }

    async deleteCollection(enterpriseId: string, collectionId: string) {
      return this.request<void>(
        `/knowledge/collections/${collectionId}?enterprise_id=${enterpriseId}`,
        { method: "DELETE" }
      )
    }

    async getCollectionDocuments(enterpriseId: string, collectionId: string) {
      return this.request<Document[]>(
        `/knowledge/collections/${collectionId}/documents?enterprise_id=${enterpriseId}`
      )
    }

    async getDocumentContent(enterpriseId: string, documentId: string) {
      return this.request<{ document_id: string; title: string; content: string; chunk_count: number }>(
        `/knowledge/documents/${documentId}/content?enterprise_id=${enterpriseId}`
      )
    }

    async deleteDocument(enterpriseId: string, documentId: string) {
      return this.request<void>(
        `/knowledge/documents/${documentId}?enterprise_id=${enterpriseId}`,
        { method: "DELETE" }
      )
    }
  }
}
