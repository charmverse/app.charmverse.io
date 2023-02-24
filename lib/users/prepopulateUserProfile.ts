import type { User } from '@prisma/client';

import { prisma } from 'db';
import { getUserS3FilePath, uploadUrlToS3 } from 'lib/aws/uploadToS3Server';
import { getENSDetails } from 'lib/blockchain';
import log from 'lib/log';
import { getUserNFTs } from 'lib/profile/getUserNFTs';
import { updateProfileAvatar } from 'lib/profile/updateProfileAvatar';
import { getFilenameWithExtension } from 'lib/utilities/getFilenameWithExtension';

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
  const pathInS3 = getUserS3FilePath({ userId: user.id, url: getFilenameWithExtension(ensDetails?.avatar ?? '') });

  if (!user.avatar && ensDetails?.avatar) {
    try {
      const { url } = await uploadUrlToS3({ pathInS3, url: ensDetails.avatar });
      await updateProfileAvatar({
        avatar: url,
        avatarContract: null,
        avatarTokenId: null,
        avatarChain: null,
        userId: user.id
      });
    } catch (e) {
      log.error('Failed to save avatar', { error: e, pathInS3, url: ensDetails?.avatar, userId: user.id });
    }
  }

  if (ensDetails?.description || ensDetails?.discord || ensDetails?.github || ensDetails?.twitter) {
    try {
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
    } catch (error) {
      log.error('Failed to update user details', { userId: user.id, error });
    }
  }

  const nfts = await getUserNFTs(user.id);

  if (nfts.length > 0) {
    if (!user.avatar && !ensDetails?.avatar) {
      for (const nft of nfts) {
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
      }
    }

    const fiveNFTs = nfts.slice(0, 5);
    try {
      await Promise.all(
        fiveNFTs.map(async (nft) => {
          await prisma.profileItem.create({
            data: {
              id: nft.id,
              userId: user.id,
              isHidden: true,
              isPinned: true,
              type: 'nft'
            }
          });
        })
      );
    } catch (error) {
      log.error('Failed to update user profile items with max 5 nfts', { userId: user.id, error });
    }
  }
}
