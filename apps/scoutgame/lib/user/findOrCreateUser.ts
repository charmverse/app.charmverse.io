import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { Scout } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getUserS3FilePath, uploadUrlToS3 } from '@root/lib/aws/uploadToS3Server';
import { getENSDetails, getENSName } from '@root/lib/blockchain/getENSName';
import { shortWalletAddress } from '@root/lib/utils/blockchain';
import { getFilenameWithExtension } from '@root/lib/utils/getFilenameWithExtension';
import { v4 } from 'uuid';

export async function findOrCreateUser({
  newUserId,
  walletAddress,
  farcasterId
}: {
  walletAddress: string;
  farcasterId?: string;
  newUserId?: string;
}): Promise<Scout> {
  const lowercaseAddress = walletAddress.toLowerCase();

  const scout = await prisma.scout.findFirst({
    where: {
      OR: [{ walletAddress: lowercaseAddress }, { farcasterId }]
    }
  });

  if (scout) {
    return scout;
  }

  const ens = await getENSName(lowercaseAddress).catch((error) => {
    log.warn('Could not retrieve ENS while creating a user', { error });
    return null;
  });
  const ensDetails = await getENSDetails(ens).catch((error) => {
    log.warn('Could not retrieve ENS details while creating a user', { error });
  });

  const userId = newUserId || v4();

  let avatarUrl = '';
  if (ensDetails?.avatar) {
    const pathInS3 = getUserS3FilePath({ userId, url: getFilenameWithExtension(ensDetails?.avatar) });
    try {
      const { url } = await uploadUrlToS3({ pathInS3, url: ensDetails?.avatar });
      avatarUrl = url;
    } catch (e) {
      log.error('Failed to save avatar', { error: e, pathInS3, url: ensDetails?.avatar, userId });
      throw new InvalidInputError('Failed to save avatar');
    }
  }

  const newScout = await prisma.scout.create({
    data: {
      id: userId,
      avatar: avatarUrl,
      username: ens ?? shortWalletAddress(lowercaseAddress),
      walletAddress: lowercaseAddress,
      walletENS: ens,
      farcasterId
    }
  });

  return newScout;
}
