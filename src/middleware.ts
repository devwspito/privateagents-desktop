import { NextResponse } from "next/server"

import type { NextRequest } from "next/server"

import { isGuestRoute, isPublicRoute } from "@/lib/auth-routes"
import {
  ensureLocalizedPathname,
  getLocaleFromPathname,
  getPreferredLocale,
  isPathnameMissingLocale,
} from "@/lib/i18n"
import { ROUTE_TO_PERMISSION } from "@/lib/permissions"
import { ensureRedirectPathname, ensureWithoutPrefix } from "@/lib/utils"

function redirect(pathname: string, request: NextRequest) {
  const { search, hash } = request.nextUrl
  let resolvedPathname = pathname

  if (isPathnameMissingLocale(pathname)) {
    const preferredLocale = getPreferredLocale(request)
    resolvedPathname = ensureLocalizedPathname(pathname, preferredLocale)
  }
  if (search) {
    resolvedPathname += search
  }
  if (hash) {
    resolvedPathname += hash
  }

  const redirectUrl = new URL(resolvedPathname, request.url).toString()
  return NextResponse.redirect(redirectUrl)
}

/**
 * Read the auth_session cookie set by AuthProvider.
 * Contains { role, permissions } — lightweight, no secrets.
 */
function getAuthFromCookie(request: NextRequest): {
  role?: string
  permissions?: string[]
} | null {
  const cookie = request.cookies.get("auth_session")?.value
  if (!cookie) return null
  try {
    return JSON.parse(cookie)
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const locale = getLocaleFromPathname(pathname)
  const pathnameWithoutLocale = ensureWithoutPrefix(pathname, `/${locale}`)
  const isNotPublic = !isPublicRoute(pathnameWithoutLocale)

  // Handle authentication for protected and guest routes
  if (isNotPublic) {
    const auth = getAuthFromCookie(request)
    const isAuthenticated = !!auth
    const isGuest = isGuestRoute(pathnameWithoutLocale)
    const isProtected = !isGuest

    // Redirect authenticated users away from guest routes
    if (isAuthenticated && isGuest) {
      const isAdminRole =
        auth.role === "admin" || auth.role === "super_admin"
      const home = isAdminRole
        ? process.env["HOME_PATHNAME"] || "/apps/dashboard"
        : "/apps/chat"
      return redirect(home, request)
    }

    // Redirect unauthenticated users from protected routes to sign-in
    if (!isAuthenticated && isProtected) {
      let redirectPathname = "/sign-in"

      // Maintain the original path for redirection
      if (pathnameWithoutLocale !== "") {
        redirectPathname = ensureRedirectPathname(redirectPathname, pathname)
      }

      return redirect(redirectPathname, request)
    }

    // Permission-based route protection
    if (isAuthenticated && isProtected && auth) {
      const permissions = auth.permissions
      const role = auth.role
      const isAdmin = role === "admin" || role === "super_admin"

      if (!isAdmin && permissions && !permissions.includes("*")) {
        const permissionId = ROUTE_TO_PERMISSION[pathnameWithoutLocale]
        if (permissionId && !permissions.includes(permissionId)) {
          return redirect("/apps/chat", request)
        }
      }
    }
  }

  // Redirect to localized URL if the pathname is missing a locale
  if (!locale) {
    return redirect(pathname, request)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|images|assets|docs|remote).*)",
  ],
}
