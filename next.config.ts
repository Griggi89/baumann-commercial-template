import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ISR revalidation is handled per-page via `export const revalidate = 60`
  // so we do NOT set `output: 'export'` â we need server-side features for
  // ISR + the /api/ask-claude route.

  images: {
    // Allow Google Drive thumbnails and website-files CDN
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'drive.google.com' },
      { protocol: 'https', hostname: 'cdn.prod.website-files.com' },
    ],
  },

  // Redirect root and legacy /properties paths to /deals
  async redirects() {
    return [
      { source: '/', destination: '/deals', permanent: false },
      { source: '/properties', destination: '/deals', permanent: true },
      { source: '/properties/:slug', destination: '/deals/:slug', permanent: true },
    ];
  },
};

export default nextConfig;
