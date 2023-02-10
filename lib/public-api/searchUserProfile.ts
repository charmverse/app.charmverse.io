import type { GoogleAccount, User, UserWallet } from '@prisma/client';

import { prisma } from 'db';
import type { UserProfile } from 'lib/public-api/interfaces';
import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';

export async function searchUserProfile({
  email,
  spaceIds,
  wallet
}: {
  spaceIds: string[];
  email?: string;
  wallet?: string;
}): Promise<UserProfile> {
  if (!email && !wallet) {
    throw new InvalidInputError('Either email or wallet address must be provided');
  }

  let user:
    | (User & {
        googleAccounts: GoogleAccount[];
        wallets: UserWallet[];
      })
    | null = null;

  if (email) {
    user = await prisma.user.findFirst({
      where: {
        AND: [
          { spaceRoles: { some: { spaceId: { in: spaceIds } } } },
          { OR: [{ email }, { googleAccounts: { some: { email } } }] }
        ]
      },
      include: { wallets: true, googleAccounts: true }
    });
  }

  if (wallet) {
    user = await prisma.user.findFirst({
      where: {
        AND: [{ spaceRoles: { some: { spaceId: { in: spaceIds } } } }, { wallets: { some: { address: wallet } } }]
      },
      include: { wallets: true, googleAccounts: true }
    });
  }

  if (!user) {
    if (email) {
      throw new DataNotFoundError(`A user with email ${email} was not found.`);
    } else {
      throw new DataNotFoundError(`A user with wallet address ${wallet} was not found.`);
    }
  }

  const profile = {
    id: user.id,
    avatar: user.avatar || '',
    wallet: wallet || user.wallets[0]?.address || '',
    email: email || user.email || user.googleAccounts[0]?.email || '',
    username: user.username
  };

  return profile;
}
