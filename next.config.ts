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

  // Deal URLs live at the root: /<slug>?t=<token>
  // Legacy /properties and /deals paths permanently redirect to root-level.
  // Root / renders the landing page defined in app/page.tsx.
  async redirects() {
    return [
      { source: '/properties',       destination: '/',       permanent: true },
      { source: '/properties/:slug', destination: '/:slug',  permanent: true },
      { source: '/deals',            destination: '/',       permanent: true },
      { source: '/deals/:slug',      destination: '/:slug',  permanent: true },
    ];
  },
};

export default nextConfig;
