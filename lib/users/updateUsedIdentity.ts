import type { Prisma } from '@prisma/client';
import { IdentityType } from '@prisma/client';

import { prisma } from 'db';
import getENSName from 'lib/blockchain/getENSName';
import { sessionUserRelations } from 'lib/session/config';
import { InsecureOperationError, InvalidInputError } from 'lib/utilities/errors';
import type { LoggedInUser } from 'models';

import { countConnectableIdentities } from './countConnectableIdentities';
import { getUserProfile } from './getUser';

export type IdentityUpdate = {
  displayName: string;
  identityType: IdentityType;
};

export async function updateUsedIdentity(userId: string, identityUpdate?: IdentityUpdate): Promise<LoggedInUser> {
  const user = await getUserProfile('id', userId);

  if (identityUpdate) {
    const { displayName, identityType } = identityUpdate;

    if (!displayName) {
      throw new InvalidInputError(`Display name required to update identity`);
    }

    if (!IdentityType[identityType]) {
      throw new InvalidInputError(`Invalid identity type ${identityType}`);
    }

    if (identityType === 'Google' && !user.googleAccounts.some((acc) => acc.name === displayName)) {
      throw new InsecureOperationError(`User ${userId} does not have a Google account with name ${displayName}`);
    } else if (identityType === 'Discord' && (!user.discordUser?.account as any)?.username !== displayName) {
      throw new InsecureOperationError(`User ${userId} does not have a Discord account with name ${displayName}`);
    } else if (
      identityType === 'UnstoppableDomain' &&
      !user.unstoppableDomains.some((ud) => ud.domain === displayName)
    ) {
      throw new InsecureOperationError(`User ${userId} does not have an Unstoppable Domain with name ${displayName}`);
    } else if (identityType === 'Wallet') {
      if (!user.wallets.some((wallet) => wallet.address === displayName)) {
        const ensNames = await Promise.all(user.wallets.map((wallet) => getENSName(wallet.address)));
        const matchingENSNameFound = ensNames.some((ensName) => ensName === displayName);
        if (!matchingENSNameFound) {
          throw new InsecureOperationError(`User ${userId} does not have a wallet with address ${displayName}`);
        }
      }
    } else if (identityType === 'Telegram' && (user.telegramUser?.account as any)?.username !== displayName) {
      throw new InsecureOperationError(`User ${userId} does not have a Telegram account with name ${displayName}`);
    }

    return prisma.user.update({
      where: {
        id: userId
      },
      data: {
        username: displayName,
        identityType
      },
      include: sessionUserRelations
    });
  }

  const updateContent: Prisma.UserUpdateInput = {};

  // Priority of identities: [wallet, discord, unstoppable domain, google account]
  if (user.wallets.length) {
    updateContent.username = user.wallets[0].address;
    updateContent.identityType = 'Wallet';
  } else if (user.discordUser) {
    updateContent.username = (user.discordUser.account as any).username;
    updateContent.identityType = 'Discord';
  } else if (user.unstoppableDomains.length) {
    updateContent.username = user.unstoppableDomains[0].domain;
    updateContent.identityType = 'UnstoppableDomain';
  } else if (user.googleAccounts.length) {
    updateContent.username = user.googleAccounts[0].name;
    updateContent.identityType = 'Google';
  }

  return prisma.user.update({
    where: {
      id: userId
    },
    data: updateContent,
    include: sessionUserRelations
  });
}
