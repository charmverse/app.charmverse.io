import { prisma } from '@charmverse/core';

import type { LoginWithGoogleRequest } from 'lib/google/loginWithGoogle';
import { getUserProfile } from 'lib/users/getUser';
import { softDeleteUserWithoutConnectableIdentities } from 'lib/users/softDeleteUserWithoutConnectableIdentities';
import { InvalidInputError, MissingDataError } from 'lib/utilities/errors';
import type { LoggedInUser } from 'models';

import { verifyGoogleToken } from './verifyGoogleToken';

export type ConnectGoogleAccountRequest = LoginWithGoogleRequest & { userId: string };

export async function connectGoogleAccount({
  accessToken,
  avatarUrl,
  displayName,
  userId
}: ConnectGoogleAccountRequest): Promise<LoggedInUser> {
  const verified = await verifyGoogleToken(accessToken);

  const email = verified.email;

  if (!email) {
    throw new InvalidInputError(`Email required to complete signup`);
  }

  const [user, googleAccount] = await Promise.all([
    getUserProfile('id', userId),
    prisma.googleAccount.findUnique({ where: { email } })
  ]);

  if (!user) {
    throw new MissingDataError(`User with id ${userId} not found`);
  }

  // Handle the case where this account is already attached
  if (user.id === googleAccount?.userId) {
    return user;
  }

  await prisma.googleAccount.upsert({
    where: {
      email
    },
    create: {
      name: displayName,
      avatarUrl,
      email,
      user: {
        connect: {
          id: userId
        }
      }
    },
    update: {
      avatarUrl,
      name: displayName,
      user: {
        connect: {
          id: userId
        }
      }
    }
  });
  if (googleAccount && googleAccount.userId !== userId) {
    await softDeleteUserWithoutConnectableIdentities({ userId: googleAccount.userId, newUserId: userId });
  }
  return getUserProfile('id', userId);
}
