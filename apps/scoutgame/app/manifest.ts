import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: 'scoutgame',
    name: 'Scout Game - Onchain builder network',
    short_name: 'Scout Game',
    description: 'Fantasy sports for onchain builders',
    start_url: '/',
    display: 'standalone',
    background_color: '#191919',
    theme_color: '#8742FF',
    orientation: 'portrait',
    lang: 'en',
    icons: [
      {
        src: '/images/manifest/scoutgame-logo-192.png',
        type: 'image/png',
        sizes: '192x192'
      },
      {
        src: '/images/manifest/scoutgame-logo-256.png',
        type: 'image/png',
        sizes: '256x256'
      },
      {
        src: '/images/manifest/scoutgame-logo-512.png',
        type: 'image/png',
        sizes: '512x512'
      }
    ],
    screenshots: []
  };
}
