/** @type {import('next').NextConfig} */
// VERCEL env var is auto-set to '1' on all Vercel deployments.
const isVercel = !!process.env.VERCEL;
const API_BACKEND =
  process.env.NEXT_PUBLIC_API_URL || 'https://stroik-platform.onrender.com';

const nextConfig = {
  reactStrictMode: true,

  // On Vercel the API proxy is handled by vercel.json rewrites.
  // Locally Next.js proxies /api/** and /uploads/** to FastAPI.
  async rewrites() {
    if (isVercel) return [];
    return [
      { source: '/api/:path*',     destination: `${API_BACKEND}/api/:path*` },
      { source: '/uploads/:path*', destination: `${API_BACKEND}/uploads/:path*` },
    ];
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'stroik-platform.onrender.com' },
      { protocol: 'http',  hostname: '127.0.0.1' },
      { protocol: 'http',  hostname: 'localhost' },
    ],
  },
};

// Only apply next-pwa locally — on Vercel it writes sw.js to a
// read-only output directory which silently kills the build.
let exportedConfig = nextConfig;
if (!isVercel) {
  try {
    const withPWAInit = (await import('next-pwa')).default;
    const withPWA = withPWAInit({
      dest: 'public',
      disable: process.env.NODE_ENV === 'development',
      register: true,
      skipWaiting: true,
    });
    exportedConfig = withPWA(nextConfig);
  } catch {
    // next-pwa not installed — skip silently
  }
}

export default exportedConfig;
