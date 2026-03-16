"use client"

import { useQuery } from "@tanstack/react-query"
import { useSession } from "@/providers/auth-provider"

import api from "../client"
import type { AuditQueryParams } from "../client/audit"
import { queryKeys } from "./query-keys"

export function useAuditEntries(params: Omit<AuditQueryParams, "enterprise_id"> & { enterprise_id?: string }) {
  const { data: session } = useSession()
  const enterpriseId = params.enterprise_id || session?.user?.enterprise_id || ""

  return useQuery({
    queryKey: queryKeys.auditEntries({ ...params, enterprise_id: enterpriseId }),
    queryFn: () =>
      api.listAuditEntries({ ...params, enterprise_id: enterpriseId }),
    enabled: !!enterpriseId,
  })
}
