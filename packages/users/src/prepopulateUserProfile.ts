import { log } from '@charmverse/core/log';
import type { User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { getENSDetails } from '@packages/blockchain/getENSName';
import { getUserNFTs } from '@packages/profile/getUserNFTs';
import { updateProfileAvatar } from '@packages/profile/updateProfileAvatar';
import { uniqBy } from 'lodash';

const acceptedImageFormats = ['.jpg', '.jpeg', '.png', '.webp'];

/**
 * Populate the user profile with:
 * 1. ENS details
 * 2. ENS avatar
 * 3. First NFT as a profile picture if no ENS avatar is provided
 * 4. First 5 NFTs as pinned items
 * @param user we need the user id and user avatar to populate many
 * @param ens the ENS name
 */
export async function prepopulateUserProfile(user: User, ens: string | null) {
  const ensDetails = await getENSDetails(ens);

  if (
    !user.avatar &&
    ensDetails?.avatar &&
    acceptedImageFormats.some((ext) => ensDetails?.avatar?.endsWith(ext)) &&
    !ensDetails.avatar.includes('?')
  ) {
    try {
      await updateProfileAvatar({
        avatar: ensDetails.avatar,
        avatarContract: null,
        avatarTokenId: null,
        avatarChain: null,
        userId: user.id
      });
    } catch (error) {
      log.error('Failed to save avatar from ens', { error, url: ensDetails.avatar, userId: user.id });
    }
  }

  if (ensDetails?.description || ensDetails?.discord || ensDetails?.github || ensDetails?.twitter) {
    await prisma.userDetails.create({
      data: {
        id: user.id,
        ...(ensDetails?.description ? { description: ensDetails?.description } : undefined),
        social: {
          ...(ensDetails?.discord ? { discordUsername: ensDetails?.discord } : undefined),
          ...(ensDetails?.github ? { githubURL: ensDetails?.github } : undefined),
          ...(ensDetails?.twitter ? { twitterURL: ensDetails?.twitter } : undefined)
        }
      }
    });
  }

  const nfts = await getUserNFTs(user.id);

  if (nfts.length > 0) {
    if (!user.avatar && !ensDetails?.avatar) {
      for (const nft of nfts) {
        if (acceptedImageFormats.some((ext) => nft.image.endsWith(ext)) && !nft.image.includes('?')) {
          try {
            const updatedUser = await updateProfileAvatar({
              avatar: nft.image,
              avatarContract: nft.contract,
              avatarTokenId: nft.tokenId,
              avatarChain: nft.chainId,
              userId: user.id
            });

            // I need just the first avatar update that returns successfully
            if (updatedUser?.avatar) {
              break;
            }
          } catch (error) {
            log.warn('Failed to save nft avatar', { error, url: nft.image, userId: user.id });
          }
        }
      }
    }

    const fiveNFTs = uniqBy(
      nfts.filter((nft) => !!nft.id),
      'id'
    ).slice(0, 5);

    await Promise.all(
      fiveNFTs.map((nft) =>
        prisma.profileItem.create({
          data: {
            id: nft.id,
            userId: user.id,
            isHidden: true,
            isPinned: true,
            type: 'nft',
            // Use the first wallet id when prepopulating the nft profile items
            walletId: nft.walletId
          }
        })
      )
    );
  }
}
