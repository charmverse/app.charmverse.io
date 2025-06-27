import { log } from '@packages/core/log';
import { arbitrum, avalanche, base, bsc, mainnet, fantom, mantle, optimism, polygon, zora } from 'viem/chains';

import { openseaChainsByPath } from './config';

export const openseaPathsByChain = Object.entries(openseaChainsByPath).reduce<Record<string, string>>(
  (acc, [path, chain]) => {
    if (chain) {
      acc[chain.toString()] = path;
    }
    return acc;
  },
  {}
);

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
