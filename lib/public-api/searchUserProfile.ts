import { prisma } from '@charmverse/core';
import type { GoogleAccount, Prisma, Space, User, UserWallet } from '@charmverse/core/dist/prisma';

import type { UserProfile } from 'lib/public-api/interfaces';
import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';

import { mapSpace } from './createWorkspaceApi';

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
        spaceRoles: { space: Space }[];
      })
    | null = null;

  const relationships = {
    wallets: true,
    googleAccounts: true,
    spaceRoles: { include: { space: true } }
  } satisfies Prisma.UserInclude;

  if (email) {
    user = await prisma.user.findFirst({
      where: {
        AND: [
          { spaceRoles: { some: { spaceId: { in: spaceIds } } } },
          { OR: [{ email }, { googleAccounts: { some: { email } } }] }
        ]
      },
      include: relationships
    });
  }

  if (wallet) {
    user = await prisma.user.findFirst({
      where: {
        AND: [{ spaceRoles: { some: { spaceId: { in: spaceIds } } } }, { wallets: { some: { address: wallet } } }]
      },
      include: relationships
    });
  }

  if (!user) {
    if (email) {
      throw new DataNotFoundError(`A user with email ${email} was not found.`);
    } else {
      throw new DataNotFoundError(`A user with wallet address ${wallet} was not found.`);
    }
  }

  const profile: UserProfile = {
    id: user.id,
    avatar: user.avatar || '',
    wallet: wallet || user.wallets[0]?.address || '',
    email: email || user.email || user.googleAccounts[0]?.email || '',
    username: user.username,
    spaces: user.spaceRoles.map((role) => mapSpace(role.space))
  };

  return profile;
}
