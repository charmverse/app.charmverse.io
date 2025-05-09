/* eslint-disable camelcase */
import { Source_Serif_4 } from 'next/font/google';
import localFont from 'next/font/local';

export const defaultFont =
  'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"';

export const serifFont = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-family-serif',
  fallback: ['Georgia', 'ui-serif', 'serif'],
  weight: ['400', '600', '700']
});

export const monoFont = localFont({
  variable: '--font-family-mono',
  fallback: ['Nitti', 'Menlo', 'Courier', 'monospace'],
  src: [
    {
      path: './fonts/ia-writer-mono/ia-writer-mono-latin-400-normal.woff2',
      weight: '400',
      style: 'normal'
    },
    {
      path: './fonts/ia-writer-mono/ia-writer-mono-latin-400-italic.woff2',
      weight: '400',
      style: 'italic'
    },
    {
      path: './fonts/ia-writer-mono/ia-writer-mono-latin-700-normal.woff2',
      weight: '600',
      style: 'normal'
    },
    {
      path: './fonts/ia-writer-mono/ia-writer-mono-latin-700-italic.woff2',
      weight: '600',
      style: 'italic'
    },
    {
      path: './fonts/ia-writer-mono/ia-writer-mono-latin-700-normal.woff2',
      weight: '700',
      style: 'normal'
    }
  ]
});

export const fontClassName = `${serifFont.variable} ${monoFont.variable}`;
