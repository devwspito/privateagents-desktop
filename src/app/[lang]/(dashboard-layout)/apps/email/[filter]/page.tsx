import { EmailList } from "../_components/email-list"
import { EmailNotFound } from "../_components/email-not-found"

const VALID_FILTERS = new Set([
  "inbox",
  "sent",
  "draft",
  "starred",
  "spam",
  "trash",
  "personal",
  "work",
  "important",
])

export default async function EmailPage(props: {
  params: Promise<{ filter: string }>
}) {
  const params = await props.params
  const filter = params.filter

  if (VALID_FILTERS.has(filter)) {
    return <EmailList />
  }

  return <EmailNotFound />
}
