"use client"

import { useSession } from "@/providers/auth-provider"

import type { NavigationType } from "@/types"

/**
 * Hook for page-level permission checks.
 *
 * Admins and super_admins always have full access.
 * Other users are filtered based on their permissions array from the JWT.
 */
export function usePermissions() {
  const { data: session } = useSession()

  const permissions: string[] = session?.user?.permissions ?? []
  const role = session?.user?.role
  const isAdmin = role === "admin" || role === "super_admin"

  // Admins with explicit permissions are restricted to those permissions.
  // Admins without permissions (or with wildcard) have full access.
  const hasExplicitPermissions =
    permissions.length > 0 && !permissions.includes("*")
  const hasFullAccess = isAdmin && !hasExplicitPermissions

  function hasPermission(permissionId: string): boolean {
    if (hasFullAccess) return true
    if (permissions.includes("*")) return true
    return permissions.includes(permissionId)
  }

  function filterNavigation(navData: NavigationType[]): NavigationType[] {
    if (hasFullAccess) return navData

    return navData
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (!("permissionId" in item) || !item.permissionId) return true
          return hasPermission(item.permissionId)
        }),
      }))
      .filter((section) => section.items.length > 0)
  }

  return { hasPermission, filterNavigation, permissions, isAdmin }
}
