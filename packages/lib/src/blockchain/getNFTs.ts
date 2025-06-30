import type { UserWallet } from '@charmverse/core/prisma';
import { isTestEnv } from '@packages/config/constants';
import { log } from '@packages/core/log';
import orderBy from 'lodash/orderBy';

// Alchemy APIs
import {
  getNFTs as getNFTsFromAlchemy,
  getNFT as getNFTFromAlchemy,
  getNFTOwners as getNFTOwnersFromAlchemy
} from './provider/alchemy/client';
import { supportedMainnets as supportedMainnetsByAlchemy } from './provider/alchemy/config';
import type { SupportedChainId as SupportedChainIdByAlchemy } from './provider/alchemy/config';
// Ankr APIs
import {
  getNFTs as getNFTsFromAnkr,
  getNFT as getNFTFromAnkr,
  getNFTOwners as getNFTOwnersFromAnkr
} from './provider/ankr/client';
import { supportedChainIds as supportedMainnetsByAnkr } from './provider/ankr/config';
import type { SupportedChainId as SupportedChainIdByAnkr } from './provider/ankr/config';
// ZKSync APIs
import { getClient as getZKSyncClient } from './provider/zksync/client';
import type { SupportedChainId as SupportedChainIdByZkSync } from './provider/zksync/config';
import { supportedNetworks as supportedZkSyncNetwork } from './provider/zksync/config';
import { getNFTs as getNftsFromZKSync } from './provider/zksync/getNFTs';
import { verifyNFTOwner as verifyNFTOwnerInZkSync } from './provider/zksync/verifyNFTOwner';
// Zora APIs
import type { SupportedChainId as SupportedChainIdByZora } from './provider/zora/config';
import { supportedNetworks as supportedNetworksByZora } from './provider/zora/config';
import { getNFT as getNFTFromZora } from './provider/zora/getNFT';
import { getNFTs as getNFTsFromZora } from './provider/zora/getNFTs';
import { verifyNFTOwner as verifyNFTOwnerFromZora } from './provider/zora/verifyNFTOwner';

export type SupportedChainId = SupportedChainIdByAlchemy | SupportedChainIdByAnkr | SupportedChainIdByZkSync;

export type NFTData = {
  id: string;
  tokenId: string;
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
  contractName?: string;
};

export async function getNFTs({ wallets }: { wallets: UserWallet[] }) {
  const [alchemyNFTs, ankrNFTs, zoraNFTs, zksyncNFTs] = await Promise.all([
    (async (): Promise<NFTData[]> => {
      const nftsByChain = await Promise.all(
        supportedMainnetsByAlchemy
          .map((chainId) =>
            wallets.map(({ id, address }) =>
              getNFTsFromAlchemy({ address, chainId, walletId: id }).catch((error) => {
                if (!isTestEnv) {
                  log.error('Error requesting nfts from Alchemy', { address, chainId, error });
                }
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
    })(),
    getNFTsFromZora({ wallets }).catch((error) => {
      if (!isTestEnv) {
        log.error('Error requesting nfts from Zora', { address: wallets[0]?.address, error });
      }
      return [] as NFTData[];
    }),
    getNftsFromZKSync({ wallets }).catch((error) => {
      if (!isTestEnv) {
        log.error('Error requesting nfts from ZKSync', { address: wallets[0]?.address, error });
      }
      return [] as NFTData[];
    })
  ]);
  const nfts = [...alchemyNFTs, ...ankrNFTs, ...zoraNFTs, ...zksyncNFTs];
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
  } else if (supportedNetworksByZora.includes(chainId as SupportedChainIdByZora)) {
    return getNFTFromZora({ address, tokenId, chainId: chainId as SupportedChainIdByZora });
  } else if (supportedZkSyncNetwork.includes(chainId as SupportedChainIdByZkSync)) {
    return getZKSyncClient({ chainId: chainId as SupportedChainIdByZkSync }).getNFTInfo({
      contractAddress: address,
      tokenId
    });
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
  } else if (supportedNetworksByZora.includes(chainId as SupportedChainIdByZora)) {
    return verifyNFTOwnerFromZora({
      contractAddress: address,
      ownerAddresses: userAddresses,
      tokenId
    });
  } else if (supportedZkSyncNetwork.includes(chainId as SupportedChainIdByZkSync)) {
    return verifyNFTOwnerInZkSync({
      contractAddress: address,
      ownerAddresses: userAddresses,
      tokenId,
      chainId: chainId as SupportedChainIdByZkSync
    });
  }
  log.warn('NFT verification requested from unsupported chainId', { chainId });
  return false;
}
