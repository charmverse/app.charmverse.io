import env from '@beam-australia/react-env';
import * as http from '@packages/adapters/http';

export type IframelyResponse = {
  html?: string;
  error?: string;
  url: string;
  links: {
    icon?: { href: string; type: string; rel: string[] }[];
    file?: {
      html?: string;
      type: 'text/html' | 'application/pdf';
      href: string;
      rel: string[];
    }[];
    // embedded readers, eg. for PDF
    reader: { href: string; html: string; media: { 'aspect-ratio': number }; rel: string[]; type: 'text/html' }[];
  };
  meta: {
    canonical: string;
    description: string;
    medium?: 'file';
    provider?: 'Google Docs';
    provider_url?: string; // eg. https://docs.google.com
    title?: string;
  };
};

export async function getIframely({ darkMode, url }: { url: string; darkMode: 'dark' | 'light' | 'auto' }) {
  const frame = await http.GET<IframelyResponse>(
    `https://cdn.iframe.ly/api/iframely`,
    {
      url,
      key: env('IFRAMELY_API_KEY'),
      iframe: '1',
      omit_script: '1',
      theme: darkMode,
      media: '0',
      card: 'small'
    },
    {
      credentials: 'omit'
    }
  );

  return frame;
}
