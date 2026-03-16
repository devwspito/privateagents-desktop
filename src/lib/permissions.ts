/**
 * Page-level permission system for role-based access control.
 *
 * Admins always have full access. Collaborators see only the pages
 * the admin has configured for them (via permission profiles or custom selection).
 *
 * IMPORTANT: Keep in sync with navigations.ts — only active sidebar items belong here.
 */

export const PAGE_PERMISSIONS = {
  // Communication
  chat: "chat",
  // Private Agents
  office: "office",
  agents: "agents",
  departments: "departments",
  users: "users",
  knowledge: "knowledge",
  integrations: "integrations", // displayed as "Tools" in sidebar
  webhooks: "webhooks",
  "communication-rules": "communication-rules",
  workflows: "workflows",
  "tool-requests": "tool-requests",
  tickets: "tickets",
  "audit-log": "audit-log",
  "gateway-config": "gateway-config",
  // Account
  settings: "settings",
  profile: "profile",
} as const

export type PermissionId = keyof typeof PAGE_PERMISSIONS

export const ALL_PERMISSION_IDS = Object.keys(
  PAGE_PERMISSIONS
) as PermissionId[]

/**
 * Human-readable labels for permission checkboxes.
 * Falls back to capitalizing the ID with dashes replaced by spaces.
 */
export const PERMISSION_LABELS: Record<string, string> = {
  chat: "Chat",
  office: "Office",
  agents: "Agents",
  departments: "Departments",
  users: "Users",
  knowledge: "Knowledge",
  integrations: "Tools",
  webhooks: "Webhooks",
  "communication-rules": "Communication Rules",
  workflows: "Workflows",
  "tool-requests": "Tool Requests",
  tickets: "Tickets",
  "audit-log": "Audit Log",
  "gateway-config": "Gateway Config",
  settings: "Settings",
  profile: "Profile",
}

/** Pre-loaded permission profiles for quick assignment. */
export const PERMISSION_PROFILES = {
  default: {
    name: "Default",
    description: "Office, Chat, Knowledge & Tools",
    permissions: ["office", "chat", "knowledge", "integrations"],
  },
  worker: {
    name: "Worker",
    description: "Chat, tools & workflows",
    permissions: [
      "chat",
      "integrations",
      "workflows",
      "tool-requests",
      "profile",
    ],
  },
  operator: {
    name: "Operator",
    description: "Day-to-day agent operations",
    permissions: ["office", "chat", "knowledge", "integrations", "tickets"],
  },
  viewer: {
    name: "Viewer",
    description: "Read-only access to office & knowledge",
    permissions: ["office", "knowledge", "profile"],
  },
  manager: {
    name: "Manager",
    description: "Team and agent management",
    permissions: [
      "office",
      "chat",
      "agents",
      "departments",
      "users",
      "knowledge",
      "integrations",
      "workflows",
      "audit-log",
    ],
  },
  developer: {
    name: "Developer",
    description: "Technical configuration",
    permissions: [
      "agents",
      "integrations",
      "webhooks",
      "communication-rules",
      "workflows",
      "tool-requests",
      "gateway-config",
    ],
  },
  full: {
    name: "Full Access",
    description: "All pages",
    permissions: ["*"],
  },
} as const

export type ProfileId = keyof typeof PERMISSION_PROFILES

/** Map route paths to permission IDs for middleware enforcement. */
export const ROUTE_TO_PERMISSION: Record<string, string> = {
  "/apps/chat": "chat",
  "/apps/office": "office",
  "/apps/agents": "agents",
  "/apps/departments": "departments",
  "/apps/users": "users",
  "/apps/knowledge": "knowledge",
  "/apps/integrations": "integrations",
  "/apps/webhooks": "webhooks",
  "/apps/communication-rules": "communication-rules",
  "/apps/workflows": "workflows",
  "/apps/tool-requests": "tool-requests",
  "/apps/tickets": "tickets",
  "/apps/audit-log": "audit-log",
  "/apps/gateway-config": "gateway-config",
  "/pages/account/settings": "settings",
  "/pages/account/profile": "profile",
}

/** Check if a set of permissions matches a known profile. Returns profile ID or "custom". */
export function detectProfile(permissions: string[]): ProfileId | "custom" {
  if (permissions.includes("*")) return "full"

  for (const [id, profile] of Object.entries(PERMISSION_PROFILES)) {
    if (id === "full") continue
    const profilePerms = [...profile.permissions].sort()
    const userPerms = [...permissions].sort()
    if (
      profilePerms.length === userPerms.length &&
      profilePerms.every((p, i) => p === userPerms[i])
    ) {
      return id as ProfileId
    }
  }

  return "custom"
}
