import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: 'sunnyawards',
    name: 'SUNNY Awards',
    short_name: 'SUNNY Awards',
    description: 'Celebrate Onchain Summer with the SUNNY Awards',
    start_url: '/',
    display: 'standalone',
    background_color: '#fff',
    theme_color: '#fff',
    orientation: 'portrait',
    lang: 'en',
    icons: [
      {
        src: '/images/manifest/icon-192.png',
        type: 'image/png',
        sizes: '192x192'
      },
      {
        src: '/images/manifest/icon-256.png',
        type: 'image/png',
        sizes: '256x256'
      },
      {
        src: '/images/manifest/icon-512.png',
        type: 'image/png',
        sizes: '512x512'
      }
    ],
    screenshots: [
      {
        src: '/images/manifest/onchainsummer-mobile1.png',
        sizes: '756x1638',
        type: 'image/png',
        // @ts-ignore Types not ready for the above options
        form_factor: 'narrow',
        label: 'Onchain summer mobile app'
      },
      {
        src: '/images/manifest/onchainsummer-mobile2.png',
        sizes: '756x1638',
        type: 'image/png',
        // @ts-ignore Types not ready for the above options
        form_factor: 'narrow',
        label: 'Onchain summer mobile app'
      },
      {
        src: '/images/manifest/onchainsummer-desktop1.png',
        sizes: '2458x1826',
        type: 'image/png',
        // @ts-ignore Types not ready for the above options
        form_factor: 'wide',
        label: 'Onchain summer desktop app'
      },
      {
        src: '/images/manifest/onchainsummer-desktop2.png',
        sizes: '2458x1826',
        type: 'image/png',
        // @ts-ignore Types not ready for the above options
        form_factor: 'wide',
        label: 'Onchain summer desktop app'
      }
    ]
  };
}
