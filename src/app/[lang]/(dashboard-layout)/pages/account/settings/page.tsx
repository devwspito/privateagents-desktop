import type { Metadata } from "next"

import { userData } from "@/data/user"

import type { UserType } from "../types"

import { DangerousZone } from "./_components/general/dangerous-zone"
import { DesktopDownloads } from "./_components/general/desktop-downloads"
import { ProfileInfo } from "./_components/general/profile-info"
import { StorageSettings } from "./_components/general/storage-settings"

// Define metadata for the page
// More info: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
export const metadata: Metadata = {
  title: "Profile Information Settings",
}

export default function ProfileInfoPage() {
  return (
    <div className="grid gap-4">
      <ProfileInfo user={userData as unknown as UserType} />
      <DesktopDownloads />
      <StorageSettings />
      <DangerousZone user={userData as unknown as UserType} />
    </div>
  )
}
