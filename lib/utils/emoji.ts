import { log } from '@charmverse/core/log';
import twemoji from 'twemoji';

import { isMac } from './browser';

// Use system font for Mac OS, but Twitter emojis for everyone else
export function getTwitterEmoji(emoji: string): string | null {
  if (isMac() || !emoji) return null;
  try {
    const html = twemoji.parse(emoji, {
      // the original maxCDN went down Jan 11, 2023
      base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/',
      folder: 'svg',
      ext: '.svg'
    }) as string;
    const match = /<img.*?src="(.*?)"/.exec(html);
    return match ? match[1] : null;
  } catch (error) {
    log.error('Could not parse emoji', { emoji, error });
    return null;
  }
}
