import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { Scout } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getUserS3FilePath, uploadUrlToS3 } from '@root/lib/aws/uploadToS3Server';
import { getENSName } from '@root/lib/blockchain/getENSName';
import { getFilenameWithExtension } from '@root/lib/utils/getFilenameWithExtension';
import { v4 } from 'uuid';
import type { Address } from 'viem';
import { isAddress } from 'viem/utils';

export async function findOrCreateUser({
  newUserId,
  farcasterId,
  walletAddresses,
  ...userProps
}: {
  walletAddresses?: string[];
  farcasterId?: number;
  walletENS?: string;
  newUserId?: string;
  avatar?: string;
  bio?: string;
  displayName: string;
  username: string;
}): Promise<Scout> {
  if (!farcasterId && !walletAddresses?.length) {
    throw new InvalidInputError('Missing required fields for user creation');
  }

  // Only valid addresses are included
  const lowercaseAddresses = walletAddresses
    ? walletAddresses.map((a) => a.toLowerCase()).filter((a): a is Address => isAddress(a))
    : undefined;

  const scout = await prisma.scout.findFirst({
    where: farcasterId ? { farcasterId } : { scoutWallet: { some: { address: { in: lowercaseAddresses } } } }
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
  if (walletAddresses?.length && !userProps.walletENS) {
    const ens = await getENSName(walletAddresses[0]).catch((error) => {
      log.warn('Could not retrieve ENS while creating a user', { error });
      return null;
    });
    userProps.walletENS = ens || undefined;
  }

  const newScout = await prisma.scout.create({
    data: {
      ...userProps,
      id: userId,
      scoutWallet: lowercaseAddresses?.length
        ? {
            create: lowercaseAddresses?.map((address) => ({
              address
            }))
          }
        : undefined,
      farcasterId
    }
  });

  return newScout;
}
