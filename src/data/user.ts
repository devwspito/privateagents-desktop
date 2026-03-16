/**
 * User Data - Placeholder for frontend components
 *
 * This data is used for profile displays and chat components.
 * In production, this should be fetched from the API based on the logged-in user.
 */

export interface User {
  id: string
  name: string
  firstName: string
  lastName: string
  email: string
  username: string
  password: string
  avatar?: string
  background?: string
  title?: string
  bio?: string
  location?: string
  state?: string
  country?: string
  website?: string
  followers: number
  following: number
  connections: number
  posts: number
  status: "online" | "offline" | "away" | "busy"
  role?: string
  organization?: string
  phoneNumber?: string
  phone?: string
  language?: string
  timezone?: string
  dateFormat?: string
  timeFormat?: string
  currency?: string
}

export const userData: User = {
  id: "current-user",
  name: "User",
  firstName: "Demo",
  lastName: "User",
  email: "user@example.com",
  username: "demo_user",
  password: "",
  avatar: undefined,
  background: undefined,
  title: "Team Member",
  bio: "",
  location: "",
  state: "",
  country: "",
  website: "",
  followers: 0,
  following: 0,
  connections: 0,
  posts: 0,
  status: "online",
  role: "Team Member",
  organization: "Company",
  phoneNumber: "",
  phone: "",
  language: "English",
  timezone: "UTC",
  dateFormat: "MM/DD/YYYY",
  timeFormat: "12h",
  currency: "USD",
}
