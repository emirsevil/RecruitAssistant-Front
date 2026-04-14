/** @type {import('next').NextConfig} */
const backendUrl = (process.env.BACKEND_URL || "https://recruitassistant-back-eo8n.onrender.com").replace(
  /\/$/,
  ""
)

const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ]
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["pdf-parse", "mammoth"],
}

export default nextConfig
