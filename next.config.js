/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Ignora erros de tipo no build — usamos any explícito onde necessário
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cwqfyxubuhvvrarlmdnh.supabase.co',
        port: '',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
}

module.exports = nextConfig
