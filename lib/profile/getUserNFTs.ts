import { prisma } from 'db';
import { getNFTs } from 'lib/blockchain/nfts';

export const supportedMainnets = [1, 137, 42161] as const;

export const getUserNFTs = async (userId: string) => {
  const profileItems = await prisma.profileItem.findMany({
    where: {
      userId,
      type: 'nft',
      OR: [{ isHidden: true }, { isPinned: true }]
    },
    select: {
      id: true,
      isHidden: true,
      isPinned: true
    }
  });

  const hiddenNftIds = profileItems.filter((p) => p.isHidden).map((p) => p.id);
  const pinnedNftIds = profileItems.filter((p) => p.isPinned).map((p) => p.id);

  const wallets = await prisma.userWallet.findMany({
    where: {
      userId
    }
  });

  const mappedNfts = (
    await Promise.all(
      supportedMainnets.map((mainnetChainId) =>
        getNFTs(
          wallets.map((w) => w.address),
          mainnetChainId
        )
      )
    )
  )
    .flat()
    .map((nft) => ({
      ...nft,
      isHidden: hiddenNftIds.includes(nft.id),
      isPinned: pinnedNftIds.includes(nft.id)
    }));

  return mappedNfts;
};
