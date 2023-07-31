import { log } from '@charmverse/core/log';

import type { SupportedChainId } from 'lib/blockchain/getNFTs';

import type { NodeAttrs } from './nft.specs';

const openseaChainsByPath: Record<string, SupportedChainId | undefined> = {
  ethereum: 1,
  bsc: 56,
  arbitrum: 42161,
  avalanche: 43114,
  matic: 137,
  optimism: 10
};

const openseaPathsByChain = Object.entries(openseaChainsByPath).reduce<Record<string, string>>((acc, [path, chain]) => {
  if (chain) {
    acc[chain.toString()] = path;
  }
  return acc;
}, {});

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

export function getNFTUrl({
  chain,
  contract,
  token
}: {
  chain: number;
  contract: string;
  token: string | number;
}): string | null {
  let link: null | string = null;
  switch (chain) {
    case 1:
    case 10:
    case 56:
    case 137:
    case 43114:
      link = `https://opensea.io/assets/${openseaPathsByChain[chain]}/${contract}/${token}`;
      break;
    // fantom chain
    case 250:
      link = `https://artion.io/explore/${contract}/${token}`;
      break;
    // Aribitrum One
    case 42161:
      link = `https://stratosnft.io/assets/${contract}/${token}`;
      break;
    case 5000:
    default:
      log.warn('Chain not configured for NFT URL', { chain });
      break;
  }
  return link;
}
