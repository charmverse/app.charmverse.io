import * as http from 'adapters/http';

export class IframelyApi {
  get(url: string) {
    return http.GET<{ html: string; error?: string }>(
      `https://cdn.iframe.ly/api/iframely`,
      {
        url,
        key: process.env.NEXT_PUBLIC_IFRAMELY_API_KEY,
        iframe: '1',
        omit_script: '1',
        media: '0',
        card: 'small'
      },
      {
        credentials: 'omit'
      }
    );
  }
}
