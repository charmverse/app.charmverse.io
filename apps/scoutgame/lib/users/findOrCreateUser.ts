import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { Scout } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getUserS3FilePath, uploadUrlToS3 } from '@root/lib/aws/uploadToS3Server';
import { getENSName } from '@root/lib/blockchain/getENSName';
import { getFilenameWithExtension } from '@root/lib/utils/getFilenameWithExtension';
import { v4 } from 'uuid';

export async function findOrCreateUser({
  newUserId,
  farcasterId,
  walletAddress,
  ...userProps
}: {
  walletAddress?: string;
  farcasterId?: number;
  walletENS?: string;
  newUserId?: string;
  avatar?: string;
  bio?: string;
  displayName: string;
  username: string;
}): Promise<Scout> {
  if (!farcasterId && !walletAddress) {
    throw new InvalidInputError('Missing required fields for user creation');
  }

  const lowercaseAddress = walletAddress?.toLowerCase();

  const scout = await prisma.scout.findFirst({
    where: farcasterId ? { farcasterId } : { walletAddress: lowercaseAddress }
  });

  if (scout) {
    return scout;
  }

  const userId = newUserId || v4();

  // upload avatars in case they are hosted on IPFS
  if (userProps?.avatar) {
    const pathInS3 = getUserS3FilePath({ userId, url: getFilenameWithExtension(userProps?.avatar) });
    try {
      const { url } = await uploadUrlToS3({ pathInS3, url: userProps?.avatar });
      userProps.avatar = url;
    } catch (e) {
      log.error('Failed to save avatar', { error: e, pathInS3, url: userProps?.avatar, userId });
      throw new InvalidInputError('Failed to save avatar');
    }
  }

  // retrieve ENS name if wallet address is provided

  if (walletAddress && !userProps.walletENS) {
    const ens = await getENSName(walletAddress).catch((error) => {
      log.warn('Could not retrieve ENS while creating a user', { error });
      return null;
    });
    userProps.walletENS = ens || undefined;
  }

  const newScout = await prisma.scout.create({
    data: {
      ...userProps,
      id: userId,
      walletAddress: lowercaseAddress,
      farcasterId
    }
  });

  return newScout;
}
