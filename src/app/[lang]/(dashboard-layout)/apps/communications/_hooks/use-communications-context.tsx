"use client"

import { useContext } from "react"

import type { CommunicationsContextType } from "../types"

import { CommunicationsContext } from "../_contexts/communications-context"

export function useCommunicationsContext(): CommunicationsContextType {
  const context = useContext(CommunicationsContext)
  if (context === undefined) {
    throw new Error(
      "useCommunicationsContext must be used within a CommunicationsProvider"
    )
  }
  return context
}
