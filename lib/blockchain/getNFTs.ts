import { log } from '@charmverse/core/log';
import type { UserWallet } from '@charmverse/core/prisma';
import orderBy from 'lodash/orderBy';

import {
  supportedMainnets as supportedMainnetsByAlchemy,
  getNFTs as getNFTsFromAlchemy,
  getNFT as getNFTFromAlchemy,
  getNFTOwners as getNFTOwnersFromAlchemy
} from './provider/alchemy';
import type { SupportedChainId as SupportedChainIdByAlchemy } from './provider/alchemy';
import {
  supportedMainnets as supportedMainnetsByAnkr,
  getNFTs as getNFTsFromAnkr,
  getNFT as getNFTFromAnkr,
  getNFTOwners as getNFTOwnersFromAnkr
} from './provider/ankr';
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
  const [alchemyNFTs, ankrNFTs] = await Promise.all([
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
  const nfts = [...alchemyNFTs, ...ankrNFTs];
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
    return getNFTFromAlchemy({ address, tokenId, chainId: chainId as SupportedChainIdByAlchemy });
  } else if (supportedMainnetsByAnkr.includes(chainId as SupportedChainIdByAnkr)) {
    return getNFTFromAnkr({ address, tokenId, chainId: chainId as SupportedChainIdByAnkr });
  }
  log.warn('NFT requested from unsupported chainId', { chainId });
  return null;
}

export type NFTOwnerRequest = {
  address: string;
  tokenId: string;
  chainId: SupportedChainId;
  userAddresses: string[];
};

export async function verifyNFTOwner({
  address,
  tokenId,
  chainId = 1,
  userAddresses
}: NFTOwnerRequest): Promise<boolean> {
  if (supportedMainnetsByAlchemy.includes(chainId as SupportedChainIdByAlchemy)) {
    const owners = await getNFTOwnersFromAlchemy({ address, tokenId, chainId: chainId as SupportedChainIdByAlchemy });
    return userAddresses.some((a) => owners.some((o) => o.toLowerCase() === a.toLowerCase()));
  } else if (supportedMainnetsByAnkr.includes(chainId as SupportedChainIdByAnkr)) {
    // Note: Ankr does not require a tokenId, which means the list could be very long. Maybe we should request NFTs by owner instead?
    const owners = await getNFTOwnersFromAnkr({ address, chainId: chainId as SupportedChainIdByAnkr });
    return userAddresses.some((a) => owners.some((o) => o.toLowerCase() === a.toLowerCase()));
  }
  log.warn('NFT verification requested from unsupported chainId', { chainId });
  return false;
}
