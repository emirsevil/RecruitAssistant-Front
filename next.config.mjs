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
  // /ra-api → app/ra-api/[[...path]]/route.ts (server proxy; follows backend redirects without exposing API host to the browser)
}

export default nextConfig
