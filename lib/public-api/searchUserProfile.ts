import type { GoogleAccount, Prisma, User, UserWallet } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { DataNotFoundError, InvalidInputError } from '@packages/utils/errors';
import type { UserProfile } from '@root/lib/public-api/interfaces';

export type UserInfo = Pick<User, 'id' | 'avatar' | 'email' | 'username'> & {
  googleAccounts: Pick<GoogleAccount, 'email'>[];
  wallets: Pick<UserWallet, 'address'>[];
};

export const userProfileSelect = {
  avatar: true,
  email: true,
  username: true,
  id: true,
  wallets: {
    select: {
      address: true
    }
  },
  googleAccounts: {
    select: {
      email: true
    }
  }
} satisfies Prisma.UserSelect;

export function getUserProfile(user: UserInfo): UserProfile {
  return {
    id: user.id,
    avatar: user.avatar || '',
    wallet: user.wallets[0]?.address || '',
    email: user.email || user.googleAccounts[0]?.email || '',
    username: user.username
  };
}

export async function searchUserProfile({
  userId,
  email,
  wallet,
  spaceIds
}: {
  spaceIds?: string[];
  userId?: string;
  email?: string;
  wallet?: string;
}): Promise<UserProfile> {
  if (!email && !wallet && !userId) {
    throw new InvalidInputError('Either user id, email or wallet address must be provided');
  }

  let user: UserInfo | null = null;

  if (email) {
    user = await prisma.user.findFirst({
      where: {
        AND: [
          spaceIds ? { spaceRoles: { some: { spaceId: { in: spaceIds } } } } : {},
          {
            OR: [{ email }, { googleAccounts: { some: { email } } }]
          }
        ]
      },
      select: userProfileSelect
    });
  }

  if (wallet) {
    user = await prisma.user.findFirst({
      where: {
        AND: [
          spaceIds ? { spaceRoles: { some: { spaceId: { in: spaceIds } } } } : {},
          {
            wallets: { some: { address: wallet.toLowerCase() } }
          }
        ]
      },
      select: userProfileSelect
    });
  }

  if (userId) {
    user = await prisma.user.findFirst({
      where: {
        AND: [spaceIds ? { spaceRoles: { some: { spaceId: { in: spaceIds } } } } : {}, { id: userId }]
      },
      select: userProfileSelect
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

  const userProfile = getUserProfile(user);

  return {
    ...userProfile,
    email: email || userProfile.email,
    wallet: wallet || userProfile.wallet
  };
}
