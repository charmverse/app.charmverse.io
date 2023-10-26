import type { GoogleAccount, Prisma, User, UserWallet } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import type { UserProfile } from 'lib/public-api/interfaces';
import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';

export async function searchUserProfile({
  userId,
  email,
  wallet
}: {
  userId?: string;
  email?: string;
  wallet?: string;
}): Promise<UserProfile> {
  if (!email && !wallet && !userId) {
    throw new InvalidInputError('Either user id, email or wallet address must be provided');
  }

  let user:
    | (User & {
        googleAccounts: GoogleAccount[];
        wallets: UserWallet[];
      })
    | null = null;

  const relationships = {
    wallets: true,
    googleAccounts: true
  } satisfies Prisma.UserInclude;

  if (email) {
    user = await prisma.user.findFirst({
      where: { OR: [{ email }, { googleAccounts: { some: { email } } }] },
      include: relationships
    });
  }

  if (wallet) {
    user = await prisma.user.findFirst({
      where: { wallets: { some: { address: wallet.toLowerCase() } } },
      include: relationships
    });
  }

  if (userId) {
    user = await prisma.user.findUnique({
      where: { id: userId },
      include: relationships
    });
  }

  if (!user) {
    if (email) {
      throw new DataNotFoundError(`A user with email ${email} was not found.`);
    } else if (wallet) {
      throw new DataNotFoundError(`A user with wallet address ${wallet} was not found.`);
    } else {
      throw new DataNotFoundError(`A user with id ${userId} was not found.`);
    }
  }

  const profile: UserProfile = {
    id: user.id,
    avatar: user.avatar || '',
    wallet: wallet || user.wallets[0]?.address || '',
    email: email || user.email || user.googleAccounts[0]?.email || '',
    username: user.username
  };

  return profile;
}
