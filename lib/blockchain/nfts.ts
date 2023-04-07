import type { UserWallet } from '@prisma/client';

import type { NftData } from './interfaces';
import * as alchemyApi from './provider/alchemy';

export async function getNFTs({
  wallets,
  userId,
  chainId = 1
}: {
  wallets: UserWallet[];
  userId: string;
  chainId?: alchemyApi.SupportedChainId;
}) {
  const addresses = wallets.map((w) => w.address);
  const nfts = await alchemyApi.getNFTs(addresses, chainId);
  const mappedNfts = nfts.map((nft) => {
    const walletId = wallets.find((wallet) => wallet.address === nft.walletAddress)?.id ?? null;
    return mapNftFromAlchemy(nft, walletId, chainId, userId);
  });
  return mappedNfts;
}

export async function getNFT({
  contractAddress,
  tokenId,
  chainId = 1,
  userId
}: {
  contractAddress: string;
  tokenId: string;
  chainId: alchemyApi.SupportedChainId;
  userId: string;
}) {
  const nft = await alchemyApi.getNFT(contractAddress, tokenId, chainId);
  return mapNftFromAlchemy(nft, null, chainId, userId);
}

function mapNftFromAlchemy(
  nft: alchemyApi.AlchemyNft,
  walletId: string | null,
  chainId: alchemyApi.SupportedChainId,
  userId: string
): NftData {
  return {
    id: `${userId}:${nft.contract.address}:${nft.id.tokenId}`,
    tokenId: nft.id.tokenId,
    tokenIdInt: parseInt(nft.id.tokenId, 16) || null,
    contract: nft.contract.address,
    imageRaw: nft.media[0].raw,
    image: nft.media[0].raw?.startsWith('https://') ? nft.media[0].raw : nft.media[0].gateway,
    imageThumb: nft.media[0].thumbnail,
    title: nft.title,
    description: nft.description,
    chainId,
    timeLastUpdated: nft.timeLastUpdated,
    isHidden: false,
    isPinned: false,
    walletId
  };
}
