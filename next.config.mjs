import createMDX from "@next/mdx"

// Default home path for authenticated users
const HOME_PATHNAME = process.env.HOME_PATHNAME || "/apps/chat"

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone for Docker deployment
  output: "standalone",

  // Temporarily skip TypeScript and ESLint errors during build
  // TODO: Fix all type errors properly
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Allow external images (Composio logos, etc.)
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "logo.composio.dev" },
      { protocol: "https", hostname: "**.composio.dev" },
    ],
    formats: ["image/avif", "image/webp"],
  },

  // Tree-shake heavy icon/utility packages
  experimental: {
    optimizePackageImports: ["lucide-react", "react-icons", "date-fns"],
  },

  // Configure `pageExtensions` to include markdown and MDX files
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],

  // See https://lucide.dev/guide/packages/lucide-react#nextjs-example
  transpilePackages: ["lucide-react"],

  // See https://nextjs.org/docs/app/building-your-application/routing/redirecting#redirects-in-nextconfigjs
  async redirects() {
    return [
      // Redirect old approvals route to chat (approvals now integrated in tasks)
      {
        source: "/:lang/apps/approvals",
        destination: "/:lang/apps/chat",
        permanent: true,
      },
      {
        source: "/apps/approvals",
        destination: "/apps/chat",
        permanent: true,
      },
      // ⚠️ Important:
      // Always list more specific static paths before dynamic ones like "/:lang"
      // to prevent Next.js from incorrectly matching static routes as dynamic parameters.
      // For example, if "/:lang" comes before "/docs", Next.js may treat "docs" as a language.
      {
        source: "/docs",
        destination: "/docs/overview/introduction",
        permanent: true,
      },
      {
        source: "/:lang",
        destination: HOME_PATHNAME,
        permanent: true,
        has: [
          {
            type: "cookie",
            key: "next-auth.session-token",
          },
        ],
      },
      {
        source: "/:lang",
        destination: HOME_PATHNAME,
        permanent: true,
        has: [
          {
            type: "cookie",
            key: "__Secure-next-auth.session-token",
          },
        ],
      },
      {
        source: "/:lang/apps/email",
        destination: "/:lang/apps/email/inbox",
        permanent: true,
      },
    ]
  },
}

const withMDX = createMDX({
  // Add markdown plugins here, as desired
})

// Merge MDX config with Next.js config
export default withMDX(nextConfig)
