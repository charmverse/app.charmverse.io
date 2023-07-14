import type { SupportedChainId } from 'lib/blockchain/provider/alchemy';

import type { NodeAttrs } from './nft.specs';

const openseaChainsByPath: Record<string, SupportedChainId | undefined> = {
  ethereum: 1,
  arbitrum: 42161,
  matic: 137,
  optimism: 10
};

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
