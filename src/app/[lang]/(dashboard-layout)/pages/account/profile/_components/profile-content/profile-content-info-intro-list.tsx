"use client"

import { useMe } from "@/lib/api/hooks"

import { ProfileContentIntroItem } from "./profile-content-info-intro-item"

export function ProfileContentIntroList() {
  const { data: user } = useMe()

  if (!user) return null

  const u = user as typeof user & { job_title?: string; phone?: string; role?: string }

  return (
    <ul className="grid gap-y-3">
      {u.job_title && (
        <ProfileContentIntroItem
          title="Works as"
          value={u.job_title}
          iconName="BriefcaseBusiness"
        />
      )}

      <ProfileContentIntroItem
        title="Email"
        value={u.email}
        iconName="Mail"
      />

      {u.phone && (
        <ProfileContentIntroItem
          title="Phone"
          value={u.phone}
          iconName="Phone"
        />
      )}

      <ProfileContentIntroItem
        title="Role"
        value={u.role ?? "user"}
        iconName="Shield"
      />
    </ul>
  )
}
