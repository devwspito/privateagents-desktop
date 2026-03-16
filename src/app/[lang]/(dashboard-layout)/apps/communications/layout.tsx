import type { ReactNode } from "react"

import { CommunicationsApiWrapper } from "./_components/communications-api-wrapper"

export default function CommunicationsLayout({
  children,
}: {
  children: ReactNode
}) {
  return <CommunicationsApiWrapper>{children}</CommunicationsApiWrapper>
}
