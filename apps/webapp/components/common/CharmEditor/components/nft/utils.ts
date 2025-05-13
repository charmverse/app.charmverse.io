import type { NodeAttrs } from '@packages/bangleeditor/components/nft/nft.specs';
import { openseaChainsByPath } from '@packages/lib/blockchain/config';

// a function to extract user screen name and tweet id from a tweet url
export function extractAttrsFromUrl(url: string): NodeAttrs | null {
  if (!url) {
    return null;
  }

  const match = url.match(/opensea\.io\/([^/]+\/)?assets\/([^/]+)\/([^/]+)\/([^/]+)/);
  if (!match) {
    return null;
  }
  const chainId = openseaChainsByPath[match[2]];
  if (!chainId) {
    return null;
  }
  return {
    chain: chainId,
    contract: match[3],
    token: match[4]
  };
}
