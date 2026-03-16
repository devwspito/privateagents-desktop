"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type {
  CollectionCreateRequest,
  CollectionUpdateRequest,
  IngestRequest,
  IngestUrlRequest,
  ScopedSearchRequest,
} from "../client"

import api from "../client"
import { queryKeys } from "./query-keys"

export function useCollections(enterpriseId: string) {
  return useQuery({
    queryKey: queryKeys.collections(enterpriseId),
    queryFn: () => api.getCollections(enterpriseId),
    enabled: !!enterpriseId,
  })
}

export function useSearchKnowledge() {
  return useMutation({
    mutationFn: ({
      enterpriseId,
      query,
    }: {
      enterpriseId: string
      query: string
    }) => api.searchKnowledge(enterpriseId, query),
  })
}

export function useIngestDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      enterpriseId,
      data,
    }: {
      enterpriseId: string
      data: IngestRequest
    }) => api.ingestDocument(enterpriseId, data),
    onSuccess: (_, { enterpriseId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections(enterpriseId),
      })
    },
  })
}

export function useEffectiveCollections(enterpriseId: string, agentId: string) {
  return useQuery({
    queryKey: queryKeys.effectiveCollections(enterpriseId, agentId),
    queryFn: () => api.getEffectiveCollections(enterpriseId, agentId),
    enabled: !!enterpriseId && !!agentId,
  })
}

export function useScopedSearchKnowledge() {
  return useMutation({
    mutationFn: ({
      enterpriseId,
      data,
    }: {
      enterpriseId: string
      data: ScopedSearchRequest
    }) => api.searchKnowledgeScoped(enterpriseId, data),
  })
}

export function useCreateCollection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      enterpriseId,
      data,
    }: {
      enterpriseId: string
      data: CollectionCreateRequest
    }) => api.createCollection(enterpriseId, data),
    onSuccess: (_, { enterpriseId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections(enterpriseId),
      })
    },
  })
}

export function useUpdateCollection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      enterpriseId,
      collectionId,
      data,
    }: {
      enterpriseId: string
      collectionId: string
      data: CollectionUpdateRequest
    }) => api.updateCollection(enterpriseId, collectionId, data),
    onSuccess: (_, { enterpriseId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections(enterpriseId),
      })
    },
  })
}

export function useDeleteCollection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      enterpriseId,
      collectionId,
    }: {
      enterpriseId: string
      collectionId: string
    }) => api.deleteCollection(enterpriseId, collectionId),
    onSuccess: (_, { enterpriseId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections(enterpriseId),
      })
    },
  })
}

export function useCollectionDocuments(
  enterpriseId: string,
  collectionId: string
) {
  return useQuery({
    queryKey: queryKeys.collectionDocuments(enterpriseId, collectionId),
    queryFn: () => api.getCollectionDocuments(enterpriseId, collectionId),
    enabled: !!enterpriseId && !!collectionId,
  })
}

export function useIngestFromUrl() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      enterpriseId,
      data,
    }: {
      enterpriseId: string
      data: IngestUrlRequest
    }) => api.ingestFromUrl(enterpriseId, data),
    onSuccess: (_, { enterpriseId, data }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections(enterpriseId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.collectionDocuments(
          enterpriseId,
          data.collection_id ?? ""
        ),
      })
    },
  })
}

export function useIngestFile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      enterpriseId,
      data,
    }: {
      enterpriseId: string
      data: {
        file: File
        collection_id: string
        document_id?: string
        title?: string
      }
    }) => api.ingestFile(enterpriseId, data.file, data.collection_id),
    onSuccess: (_, { enterpriseId, data }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections(enterpriseId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.collectionDocuments(
          enterpriseId,
          data.collection_id
        ),
      })
    },
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      enterpriseId,
      documentId,
    }: {
      enterpriseId: string
      documentId: string
    }) => api.deleteDocument(enterpriseId, documentId),
    onSuccess: (_, { enterpriseId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections(enterpriseId),
      })
      queryClient.invalidateQueries({
        queryKey: ["knowledge", "documents", enterpriseId],
      })
    },
  })
}
