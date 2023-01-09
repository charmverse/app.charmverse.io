import type { TweetNodeAttrs } from './interface';

// a function to extract user screen name and tweet id from a tweet url
export function extractTweetAttrs(url: string): TweetNodeAttrs | null {
  if (!url) {
    return null;
  }

  const match = url.match(/twitter\.com\/([^/]+)\/status\/(\d+)/);
  if (!match) {
    return null;
  }
  return {
    screenName: match[1],
    id: match[2]
  };
}
