"use client"

import { FilterBar } from "../_components/filter-bar"
import { ThreadDetail } from "../_components/thread-detail"
import { ThreadList } from "../_components/thread-list"

export default function CommunicationsPage() {
  return (
    <div className="flex flex-col gap-4 h-full">
      <FilterBar />
      <div className="flex gap-4 flex-1 min-h-0">
        <ThreadList />
        <ThreadDetail />
      </div>
    </div>
  )
}
