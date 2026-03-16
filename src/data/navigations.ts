import type { NavigationType } from "@/types"

export const navigationsData: NavigationType[] = [
  {
    title: "Communication",
    items: [
      {
        title: "Chat",
        href: "/apps/chat",
        iconName: "MessageCircle",
        permissionId: "chat",
      },
      // {
      //   title: "Email",
      //   href: "/apps/email",
      //   iconName: "AtSign",
      //   permissionId: "email",
      // },
      // {
      //   title: "Calendar",
      //   href: "/apps/calendar",
      //   iconName: "Calendar",
      //   permissionId: "calendar",
      // },
    ],
  },
  {
    title: "Private Agents",
    items: [
      // {
      //   title: "Dashboard",
      //   href: "/apps/dashboard",
      //   iconName: "LayoutDashboard",
      //   permissionId: "dashboard",
      // },
      // {
      //   title: "My Agent",
      //   href: "/apps/my-agent",
      //   iconName: "Bot",
      //   permissionId: "my-agent",
      // },
      // {
      //   title: "Tasks",
      //   href: "/apps/tasks",
      //   iconName: "ListChecks",
      //   permissionId: "tasks",
      // },
      {
        title: "Office",
        href: "/apps/office",
        iconName: "Building2",
        permissionId: "office",
      },
      {
        title: "Agents",
        href: "/apps/agents",
        iconName: "Bot",
        permissionId: "agents",
      },
      {
        title: "Departments",
        href: "/apps/departments",
        iconName: "Building",
        permissionId: "departments",
      },
      {
        title: "Users",
        href: "/apps/users",
        iconName: "Users",
        permissionId: "users",
      },
      {
        title: "Knowledge",
        href: "/apps/knowledge",
        iconName: "BookOpen",
        permissionId: "knowledge",
      },
      {
        title: "Tools",
        href: "/apps/integrations",
        iconName: "Wrench",
        permissionId: "integrations",
      },
      {
        title: "Webhooks",
        href: "/apps/webhooks",
        iconName: "Webhook",
        permissionId: "webhooks",
      },
      // {
      //   title: "Channels",
      //   href: "/apps/channels",
      //   iconName: "Radio",
      //   permissionId: "channels",
      // },
      {
        title: "Communication Rules",
        href: "/apps/communication-rules",
        iconName: "ArrowLeftRight",
        permissionId: "communication-rules",
      },
      {
        title: "Workflows",
        href: "/apps/workflows",
        iconName: "Workflow",
        permissionId: "workflows",
      },
      {
        title: "Tool Requests",
        href: "/apps/tool-requests",
        iconName: "Wrench",
        permissionId: "tool-requests",
      },
      {
        title: "Tickets",
        href: "/apps/tickets",
        iconName: "Headset",
        permissionId: "tickets",
      },
      {
        title: "Audit Log",
        href: "/apps/audit-log",
        iconName: "FileText",
        permissionId: "audit-log",
      },
      {
        title: "Gateway Config",
        href: "/apps/gateway-config",
        iconName: "Settings",
        permissionId: "gateway-config",
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        title: "Settings",
        href: "/pages/account/settings",
        iconName: "UserCog",
        permissionId: "settings",
      },
      {
        title: "Profile",
        href: "/pages/account/profile",
        iconName: "User",
        permissionId: "profile",
      },
    ],
  },
]
