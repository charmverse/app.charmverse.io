import { prisma } from '@charmverse/core/prisma-client';

import { getNFTs } from 'lib/blockchain/getNFTs';

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
  const hiddenNftIds = profileItems.filter((p) => p.isHidden).map((p) => p.id.replace(`${userId}:`, ''));
  const pinnedNftIds = profileItems.filter((p) => p.isPinned).map((p) => p.id.replace(`${userId}:`, ''));

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
    isHidden: hiddenNftIds.includes(nft.id),
    isPinned: pinnedNftIds.includes(nft.id)
  }));
};
