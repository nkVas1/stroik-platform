import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

const API_BACKEND = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  /**
   * Proxy /uploads/** to FastAPI so <img src="/uploads/..."> works.
   * Without this Next.js (port 3000) would try to serve those files
   * itself and return 404, since the uploads dir lives on FastAPI.
   */
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: `${API_BACKEND}/uploads/:path*`,
      },
    ];
  },
};

export default withPWA(nextConfig);
