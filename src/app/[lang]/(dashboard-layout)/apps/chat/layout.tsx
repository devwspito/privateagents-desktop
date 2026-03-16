import type { ReactNode } from "react"

import { ChatApiWrapper } from "./_components/chat-api-wrapper"

export default function ChatLayout({ children }: { children: ReactNode }) {
  return <ChatApiWrapper>{children}</ChatApiWrapper>
}
