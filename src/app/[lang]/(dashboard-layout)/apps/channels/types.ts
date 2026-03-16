import type { IconType } from "@/types"

export type ChannelAuthType =
  | "qr_code"
  | "bot_token"
  | "oauth"
  | "access_token"
  | "link_device"
  | "local"
  | "none"

export interface ChannelDefinition {
  id: string
  name: string
  icon: IconType
  color: string
  description: string
  auth: ChannelAuthType
  features: string[]
}

export interface ChannelStatusInfo {
  connected: boolean
  last_seen: string | null
  username?: string
  workspace?: string
}

export type ChannelStatusMap = Record<string, ChannelStatusInfo>
