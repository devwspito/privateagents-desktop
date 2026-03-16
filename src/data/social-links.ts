/**
 * Social Media Links
 * Links to social media profiles
 */

export interface SocialLink {
  id: string
  name: string
  icon: string
  href: string
  label?: string
}

export const socialLinks: SocialLink[] = [
  {
    id: "twitter",
    name: "Twitter",
    icon: "twitter",
    href: "#",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: "linkedin",
    href: "#",
  },
  {
    id: "github",
    name: "GitHub",
    icon: "github",
    href: "#",
  },
]

// Alias for backward compatibility
export const socialLinksData = socialLinks
