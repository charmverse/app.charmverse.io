import { prisma } from 'db';
import { getUserNFTs } from 'lib/profile/getUserNFTs';
import { updateProfileAvatar } from 'lib/profile/updateProfileAvatar';

// Populate the user profile with the first nft as a profile picture and the first 5 nfts he has as pinned
export async function prepopulateUserProfile(userId: string) {
  const nfts = await getUserNFTs(userId);
  if (nfts.length > 0) {
    for (const nft of nfts) {
      const user = await updateProfileAvatar({
        avatar: nft.image,
        avatarContract: nft.contract,
        avatarTokenId: nft.tokenId,
        avatarChain: nft.chainId,
        userId
      });

      // I need just the first avatar update that returns successfully
      if (user?.avatar) {
        break;
      }
    }

    const fiveNFTs = nfts.slice(0, 5);
    await Promise.all(
      fiveNFTs.map(async (nft) => {
        await prisma.profileItem.create({
          data: {
            id: nft.id,
            userId,
            isHidden: true,
            isPinned: true,
            type: 'nft'
          }
        });
      })
    );
  }
}
