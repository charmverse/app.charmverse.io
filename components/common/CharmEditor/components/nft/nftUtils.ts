import type { NodeAttrs } from './nftSpec';

// a function to extract user screen name and tweet id from a tweet url
export function extractAttrsFromUrl(url: string): NodeAttrs | null {
  if (!url) {
    return null;
  }

  const match = url.match(/opensea\.io\/assets\/ethereum\/([^/]+)\/([^/]+)/);
  if (!match) {
    return null;
  }
  return {
    chain: 1,
    contract: match[1],
    token: match[2]
  };
}

// a function to extract user screen name and tweet id from a tweet url
export function extractAttrsFromEmbedCode(url: string): NodeAttrs | null {
  if (!url) {
    return null;
  }
  const match = url.replaceAll(/\s/g, '').match(/<nft-cardcontractAddress="([^"]+)"tokenId="([^"]+)"/);
  if (!match) {
    return null;
  }
  return {
    // embed only supports ethereum for now
    chain: 1,
    contract: match[1],
    token: match[2]
  };
}
