import type { NftNodeAttrs } from 'lib/nft/interface';

// a function to extract user screen name and tweet id from a tweet url
export function extractAttrsFromEmbedCode(url: string): NftNodeAttrs | null {
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
