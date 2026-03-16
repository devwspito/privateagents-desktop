import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const GITHUB_REPO = "devwspito/agents-autonomy"

export async function GET() {
  const token = process.env["GITHUB_TOKEN"]

  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
      {
        headers,
        cache: "no-store",
      }
    )

    if (!res.ok) {
      return NextResponse.json({ assets: [], html_url: null }, { status: 200 })
    }

    const data = await res.json()

    return NextResponse.json({
      assets: (data.assets || []).map(
        (a: { name: string; browser_download_url: string; size: number }) => ({
          name: a.name,
          browser_download_url: a.browser_download_url,
          size: a.size,
        })
      ),
      html_url: data.html_url || null,
      tag_name: data.tag_name || null,
    })
  } catch {
    return NextResponse.json({ assets: [], html_url: null }, { status: 200 })
  }
}
