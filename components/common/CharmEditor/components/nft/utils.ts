import { log } from '@charmverse/core/log';
import { arbitrum, avalanche, base, bsc, mainnet, fantom, mantle, optimism, polygon, zora } from 'viem/chains';

import type { SupportedChainId } from 'lib/blockchain/getNFTs';

import type { NodeAttrs } from './nft.specs';

const openseaChainsByPath: Record<string, SupportedChainId | undefined> = {
  ethereum: 1,
  bsc: 56,
  base: base.id,
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
    case mainnet.id:
    case optimism.id:
    case base.id:
    case bsc.id:
    case polygon.id:
    case arbitrum.id:
    case avalanche.id:
      link = `https://opensea.io/assets/${openseaPathsByChain[chain]}/${contract}/${token}`;
      break;
    // fantom chain
    case fantom.id:
      link = `https://artion.io/explore/${contract}/${token}`;
      break;
    case zora.id:
      link = `https://zora.co/collect/zora:${contract}/${token}`;
      break;
    case mantle.id:
    default:
      log.warn('NFT Url is not configured for chain', { chain });
      break;
  }
  return link;
}
