import { prisma } from '@charmverse/core/prisma-client';

import type { LoginWithGoogleRequest } from 'lib/google/loginWithGoogle';
import { getUserProfile } from 'lib/users/getUser';
import { softDeleteUserWithoutConnectableIdentities } from 'lib/users/softDeleteUserWithoutConnectableIdentities';
import { updateUsedIdentity } from 'lib/users/updateUsedIdentity';
import { InvalidInputError, MissingDataError } from 'lib/utilities/errors';
import type { LoggedInUser } from 'models';

import { verifyGoogleToken } from './verifyGoogleToken';

export type ConnectGoogleAccountRequest = LoginWithGoogleRequest & { userId: string };

export async function connectGoogleAccount({
  accessToken,
  avatarUrl,
  displayName,
  userId,
  oauthParams
}: ConnectGoogleAccountRequest): Promise<LoggedInUser> {
  const verified = await verifyGoogleToken(accessToken, oauthParams);

  const email = verified.email;
  const userDisplayName = displayName || verified.name || '';
  const userAvatarUrl = avatarUrl || verified.picture || '';

  if (!email) {
    throw new InvalidInputError(`Email required to complete signup`);
  }

  const [user, googleAccount, verifiedEmail] = await Promise.all([
    getUserProfile('id', userId),
    prisma.googleAccount.findUnique({ where: { email } }),
    prisma.verifiedEmail.findUnique({ where: { email } })
  ]);

  if (!user) {
    throw new MissingDataError(`User with id ${userId} not found`);
  }

  // Handle the case where this account is already attached
  if (user.id === googleAccount?.userId) {
    return user;
  }

  await prisma.$transaction(async (tx) => {
    await tx.googleAccount.upsert({
      where: {
        email
      },
      create: {
        name: userDisplayName,
        avatarUrl: userAvatarUrl,
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
      await updateUsedIdentity(googleAccount.userId, undefined, tx);
      await softDeleteUserWithoutConnectableIdentities({ userId: googleAccount.userId, newUserId: userId, tx });
    }

    if (verifiedEmail && verifiedEmail.userId !== userId) {
      await tx.verifiedEmail.update({
        where: {
          email: verified.email
        },
        data: {
          user: { connect: { id: userId } }
        }
      });

      await updateUsedIdentity(verifiedEmail.userId, undefined, tx);
      await softDeleteUserWithoutConnectableIdentities({ userId: verifiedEmail.userId, newUserId: userId, tx });
    }
  });

  return getUserProfile('id', userId);
}
