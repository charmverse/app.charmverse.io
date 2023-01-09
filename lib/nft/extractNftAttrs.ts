import type { NftNodeAttrs } from './interface';

// a function to extract user screen name and tweet id from a tweet url
export function extractNftAttrs(url: string): NftNodeAttrs | null {
  if (!url) {
    return null;
  }

  const match = url.match(/opensea\.io\/([^/]+\/)?assets\/ethereum\/([^/]+)\/([^/]+)/);
  if (!match) {
    return null;
  }
  return {
    chain: 1,
    contract: match[2],
    token: match[3]
  };
}
