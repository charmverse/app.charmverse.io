import type { UserWallet } from '@charmverse/core/prisma';

import type { SupportedChainId } from './provider/alchemy';
import * as alchemyApi from './provider/alchemy';

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

export async function getNFTs({
  wallets,
  chainId = 1
}: {
  wallets: UserWallet[];
  chainId?: alchemyApi.SupportedChainId;
}) {
  const addresses = wallets.map((w) => w.address);
  const nfts = await alchemyApi.getNFTs(addresses, chainId);
  const mappedNfts = nfts.map((nft) => {
    const walletId = wallets.find((wallet) => wallet.address === nft.walletAddress)?.id ?? null;
    return mapNftFromAlchemy(nft, walletId, chainId);
  });
  return mappedNfts;
}

export type NFTRequest = {
  address: string;
  tokenId: string;
  chainId: alchemyApi.SupportedChainId;
};

export async function getNFT({ address, tokenId, chainId = 1 }: NFTRequest) {
  const nft = await alchemyApi.getNFT(address, tokenId, chainId);
  return mapNftFromAlchemy(nft, null, chainId);
}

function mapNftFromAlchemy(
  nft: alchemyApi.AlchemyNft,
  walletId: string | null,
  chainId: alchemyApi.SupportedChainId
): NFTData {
  let link = '';
  const tokenId = nft.id.tokenId.startsWith('0x') ? parseInt(nft.id.tokenId, 16) : nft.id.tokenId;
  if (chainId === 42161) {
    link = `https://stratosnft.io/assets/${nft.contract.address}/${tokenId}`;
  } else if (chainId === 1) {
    link = `https://opensea.io/assets/ethereum/${nft.contract.address}/${tokenId}`;
  } else if (chainId === 137) {
    link = `https://opensea.io/assets/matic/${nft.contract.address}/${tokenId}`;
  }
  // not sure if 'raw' or 'gateway' is best, but for this NFT, the 'raw' url no longer exists: https://opensea.io/assets/ethereum/0x1821d56d2f3bc5a5aba6420676a4bbcbccb2f7fd/3382
  const image = nft.media[0].gateway?.startsWith('https://') ? nft.media[0].gateway : nft.media[0].raw;
  return {
    id: `${nft.contract.address}:${nft.id.tokenId}`,
    tokenId: nft.id.tokenId,
    tokenIdInt: parseInt(nft.id.tokenId, 16) || null,
    contract: nft.contract.address,
    imageRaw: nft.media[0].raw,
    image,
    imageThumb: nft.media[0].thumbnail,
    title: nft.title,
    description: nft.description,
    chainId,
    timeLastUpdated: nft.timeLastUpdated,
    isHidden: false,
    isPinned: false,
    link,
    walletId
  };
}
