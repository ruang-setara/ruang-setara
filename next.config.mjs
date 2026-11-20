/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return { beforeFiles: [
      { source: '/', destination: '/ruang-setara.html' },
    ], afterFiles: [], fallback: [
      { source: '/api/:path*', destination: 'https://ruang-setara-id.netlify.app/api/:path*' },
    ] }
  },
  async headers() {
    return [{ source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'private, no-store' }] }]
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
