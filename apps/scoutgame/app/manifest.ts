import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: 'scoutgame',
    name: 'Scout Game - Onchain builder network',
    short_name: 'Scout Game',
    description: 'Onchain network for connecting web3 delopers, projects, organizations',
    start_url: '/',
    display: 'standalone',
    background_color: '#191919',
    theme_color: '#8742FF',
    orientation: 'portrait',
    lang: 'en',
    icons: [
      {
        src: '/images/manifest/connect-logo-192.png',
        type: 'image/png',
        sizes: '192x192'
      },
      {
        src: '/images/manifest/connect-logo-256.png',
        type: 'image/png',
        sizes: '256x256'
      },
      {
        src: '/images/manifest/connect-logo-512.png',
        type: 'image/png',
        sizes: '512x512'
      }
    ],
    screenshots: []
  };
}
