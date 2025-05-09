import { prisma } from '@charmverse/core/prisma-client';
import { getUserProfile } from '@packages/profile/getUser';
import type { LoggedInUser } from '@packages/profile/getUser';
import { softDeleteUserWithoutConnectableIdentities } from '@packages/users/softDeleteUserWithoutConnectableIdentities';
import { updateUsedIdentity } from '@packages/users/updateUsedIdentity';
import { InvalidInputError, MissingDataError, UnauthorisedActionError } from '@packages/utils/errors';
import type { LoginWithGoogleRequest } from '@packages/lib/google/loginWithGoogle';
import { checkUserSpaceBanStatus } from '@packages/lib/members/checkUserSpaceBanStatus';

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

  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      userId
    },
    select: {
      space: {
        select: {
          id: true
        }
      }
    }
  });

  const userSpaceIds = spaceRoles.map((role) => role.space.id);

  const isUserBannedFromSpace = await checkUserSpaceBanStatus({
    spaceIds: userSpaceIds,
    emails: [email]
  });

  if (isUserBannedFromSpace) {
    throw new UnauthorisedActionError(
      'You need to leave space before you can add this google identity to your account'
    );
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
