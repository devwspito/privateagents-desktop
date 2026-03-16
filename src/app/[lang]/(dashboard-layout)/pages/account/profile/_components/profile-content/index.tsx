import { DesktopDownloads } from "@/app/[lang]/(dashboard-layout)/pages/account/settings/_components/general/desktop-downloads"
import { ProfileContentInfo } from "./profile-content-info"
import { ProfileContentMainFeed } from "./profile-content-main-feed"

export function ProfileContent() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <section className="flex flex-col gap-4 md:flex-row">
        <ProfileContentInfo />
        <ProfileContentMainFeed />
      </section>
      <DesktopDownloads />
    </div>
  )
}
