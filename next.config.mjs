const backendProxyTarget = (
  process.env.BACKEND_PROXY_URL || "https://recruitassistant-back-1.onrender.com"
).replace(/\/$/, "")

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["pdf-parse", "mammoth"],
  async rewrites() {
    return [
      {
        source: "/ra-api/:path*",
        destination: `${backendProxyTarget}/:path*`,
      },
    ]
  },
}

export default nextConfig
