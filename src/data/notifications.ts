/**
 * Notifications Data
 * Placeholder notifications for the notification dropdown
 */

import type { LucideIconName } from "@/types"

export interface Notification {
  id: string
  content: string
  date: Date
  isRead: boolean
  iconName: LucideIconName
  url: string
}

export interface NotificationData {
  notifications: Notification[]
  unreadCount: number
}

export const notificationData: NotificationData = {
  notifications: [],
  unreadCount: 0,
}
