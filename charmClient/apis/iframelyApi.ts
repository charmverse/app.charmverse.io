import { getIframely } from '@root/lib/iframely/getIframely';

export class IframelyApi {
  get(url: string, darkMode: 'dark' | 'light' | 'auto') {
    return getIframely({ url, darkMode });
  }
}
