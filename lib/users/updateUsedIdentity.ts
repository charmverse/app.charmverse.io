import type { Prisma } from '@charmverse/core/prisma';
import { IdentityType } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { LoggedInUser } from '@root/lib/profile/getUser';
import { sessionUserRelations } from '@root/lib/session/config';
import { matchWalletAddress, shortWalletAddress } from '@root/lib/utils/blockchain';
import { InsecureOperationError, InvalidInputError } from '@root/lib/utils/errors';

import { getUserProfile } from '../profile/getUser';

export type IdentityUpdate = {
  displayName: string;
  identityType: IdentityType;
};

/**
 * Switch to specific identity, or auto-fallback to an existing identity if current was just deleted
 */
export async function updateUsedIdentity(
  userId: string,
  identityUpdate?: IdentityUpdate,
  tx: Prisma.TransactionClient = prisma
): Promise<LoggedInUser> {
  const user = await getUserProfile('id', userId, tx);

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
    } else if (identityType === 'Discord' && (user.discordUser?.account as any)?.username !== displayName) {
      throw new InsecureOperationError(`User ${userId} does not have a Discord account with name ${displayName}`);
    } else if (identityType === 'Wallet') {
      if (!user.wallets.some((wallet) => matchWalletAddress(displayName, wallet))) {
        throw new InsecureOperationError(`User ${userId} does not have wallet with address or ensname ${displayName}`);
      }
    } else if (identityType === 'Telegram' && (user.telegramUser?.account as any)?.username !== displayName) {
      throw new InsecureOperationError(`User ${userId} does not have a Telegram account with name ${displayName}`);
    } else if (
      identityType === 'VerifiedEmail' &&
      !user.verifiedEmails.some((email) => email.email === displayName || email.name === displayName)
    ) {
      throw new InsecureOperationError(`User ${userId} does not have a verified email with address ${displayName}`);
    }

    return tx.user.update({
      where: {
        id: userId
      },
      data: {
        username: shortWalletAddress(displayName),
        identityType
      },
      include: sessionUserRelations
    });
  }

  const updateContent: Prisma.UserUpdateInput = {};

  // Priority of identities: [wallet, discord, google account]
  if (user.wallets.length) {
    updateContent.username = shortWalletAddress(user.wallets[0].ensname ?? user.wallets[0].address);
    updateContent.identityType = 'Wallet';
  } else if (user.discordUser) {
    updateContent.username = (user.discordUser.account as any).username;
    updateContent.identityType = 'Discord';
  } else if (user.googleAccounts.length) {
    updateContent.username = user.googleAccounts[0].name;
    updateContent.identityType = 'Google';
  } else if (user.verifiedEmails.length) {
    updateContent.username = user.verifiedEmails[0].name;
    updateContent.identityType = 'VerifiedEmail';
  }

  return tx.user.update({
    where: {
      id: userId
    },
    data: updateContent,
    include: sessionUserRelations
  });
}
