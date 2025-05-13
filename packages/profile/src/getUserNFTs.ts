import { prisma } from '@charmverse/core/prisma-client';
import { getNFTs } from '@packages/lib/blockchain/getNFTs';

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

  // Backwards-compatibility: remove userId: as a prefix, since it is already specific to each user
  const pinnedNftIds = profileItems.filter((p) => p.isPinned && !p.id.startsWith(`${userId}:`)).map((p) => p.id);

  const wallets = await prisma.userWallet.findMany({
    where: {
      userId
    }
  });

  const nfts = await getNFTs({
    wallets
  });

  return nfts.map((nft) => ({
    ...nft,
    isPinned: pinnedNftIds.includes(nft.id)
  }));
};
