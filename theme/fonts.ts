/* eslint-disable camelcase */
import { Source_Serif_4 } from 'next/font/google';
import localFont from 'next/font/local';

// Fonts from Notion:
// Serif: Lyon-Text, Georgia, ui-serif, serif;
// Mono: iawriter-mono, Nitti, Menlo, Courier, monospace;

export const defaultFont =
  'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"';

export const serifFont = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-family-serif',
  weight: ['400', '600', '700']
});

export const monoFont = localFont({
  variable: '--font-family-mono',
  src: [
    {
      path: '../node_modules/@fontsource/ia-writer-mono/files/ia-writer-mono-all-400-normal.woff2',
      weight: '400',
      style: 'normal'
    },
    {
      path: '../node_modules/@fontsource/ia-writer-mono/files/ia-writer-mono-all-400-italic.woff2',
      weight: '400',
      style: 'italic'
    },
    {
      path: '../node_modules/@fontsource/ia-writer-mono/files/ia-writer-mono-all-700-normal.woff2',
      weight: '600',
      style: 'normal'
    },
    {
      path: '../node_modules/@fontsource/ia-writer-mono/files/ia-writer-mono-all-700-italic.woff2',
      weight: '600',
      style: 'italic'
    },
    {
      path: '../node_modules/@fontsource/ia-writer-mono/files/ia-writer-mono-all-700-normal.woff2',
      weight: '700',
      style: 'normal'
    }
  ]
});
