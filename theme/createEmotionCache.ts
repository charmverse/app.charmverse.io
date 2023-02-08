import createCache from '@emotion/cache';

// set up styles in Next.js for MUI based on https://github.com/mui-org/material-ui/blob/next/examples/nextjs-with-typescript/pages/_document.tsx
// Set up MUI xample: https://github.com/mui/material-ui/blob/master/examples/nextjs/pages/_document.js
// See also https://github.com/emotion-js/emotion/issues/1061 for why we need a cache provider to avoid duplicate style tags

export function createEmotionCache() {
  return createCache({ key: 'charm-styles' });
}
