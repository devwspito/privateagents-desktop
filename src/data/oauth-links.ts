/**
 * OAuth Provider Links
 * Configuration for social login providers
 */

export interface OAuthLink {
  id: string
  name: string
  icon: string
  href: string
  enabled: boolean
}

export const oauthLinks: OAuthLink[] = [
  {
    id: "google",
    name: "Google",
    icon: "google",
    href: "/api/auth/signin/google",
    enabled: false,
  },
  {
    id: "github",
    name: "GitHub",
    icon: "github",
    href: "/api/auth/signin/github",
    enabled: false,
  },
]

// Alias for backward compatibility
export const oauthLinksData = oauthLinks

// Helper to check if any OAuth providers are enabled
export const hasEnabledOAuthProviders = oauthLinks.some((link) => link.enabled)
