import { log } from '@charmverse/core/log';
import type { UserWallet } from '@charmverse/core/prisma';
import orderBy from 'lodash/orderBy';

import {
  supportedMainnets as supportedMainnetsByAlchemy,
  getNFTs as getNFTsFromAlchemy,
  getNFT as getNFTFromAlchemy
} from './provider/alchemy';
import type { SupportedChainId as SupportedChainIdByAlchemy } from './provider/alchemy';
import { supportedMainnets as supportedMainnetsByAnkr, getNFTs as getNFTsFromAnkr } from './provider/ankr';
import type { SupportedChainId as SupportedChainIdByAnkr } from './provider/ankr';

export type SupportedChainId = SupportedChainIdByAlchemy | SupportedChainIdByAnkr;

export type NFTData = {
  id: string;
  tokenId: string;
  tokenIdInt: number | null;
  contract: string;
  title: string;
  description: string;
  chainId: SupportedChainId;
  image: string;
  imageRaw: string;
  imageThumb?: string;
  timeLastUpdated: string;
  isHidden: boolean;
  isPinned: boolean;
  link: string;
  walletId: string | null;
};

export async function getNFTs({ wallets }: { wallets: UserWallet[] }) {
  const [alchemyNFts, mantleNFTs] = await Promise.all([
    (async (): Promise<NFTData[]> => {
      const nftsByChain = await Promise.all(
        supportedMainnetsByAlchemy
          .map((chainId) =>
            wallets.map(({ id, address }) =>
              getNFTsFromAlchemy({ address, chainId, walletId: id }).catch((error) => {
                log.error('Error requesting nfts from Alchemy', { address, chainId, error });
                return [] as NFTData[];
              })
            )
          )
          .flat()
      );
      return nftsByChain.flat();
    })(),
    (async (): Promise<NFTData[]> => {
      const nftsByChain = await Promise.all(
        supportedMainnetsByAnkr
          .map((chainId) =>
            wallets.map(({ id, address }) =>
              getNFTsFromAnkr({ address, chainId, walletId: id }).catch((error) => {
                log.error('Error requesting nfts from Ankr', { address, chainId, error });
                return [] as NFTData[];
              })
            )
          )
          .flat()
      );
      return nftsByChain.flat();
    })()
  ]);
  const nfts = [...alchemyNFts, ...mantleNFTs];
  const sortedNfts = orderBy(nfts, ['timeLastUpdated', 'title'], ['desc', 'asc']);
  return sortedNfts;
}

export type NFTRequest = {
  address: string;
  tokenId: string;
  chainId: SupportedChainId;
};

export async function getNFT({ address, tokenId, chainId = 1 }: NFTRequest) {
  if (supportedMainnetsByAlchemy.includes(chainId as SupportedChainIdByAlchemy)) {
    return getNFTFromAlchemy(address, tokenId, chainId as SupportedChainIdByAlchemy);
  }
  // TODO: add support to ankr
  return null;
}
