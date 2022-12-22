import { prisma } from 'db';
import type { LoginWithGoogleRequest } from 'lib/google/loginWithGoogle';
import { verifyToken } from 'lib/google/loginWithGoogle';
import { sessionUserRelations } from 'lib/session/config';
import { getUserProfile } from 'lib/users/getUser';
import { softDeleteUserWithoutConnectableIdentities } from 'lib/users/softDeleteUserWithoutConnectableIdentities';
import { InvalidInputError, MissingDataError } from 'lib/utilities/errors';
import type { LoggedInUser } from 'models';

export type ConnectGoogleAccountRequest = LoginWithGoogleRequest & { userId: string };

export async function connectGoogleAccount({
  accessToken,
  avatarUrl,
  displayName,
  userId
}: ConnectGoogleAccountRequest): Promise<LoggedInUser> {
  const verified = await verifyToken(accessToken);

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
    const oldUser = await prisma.user.findUnique({
      where: {
        id: googleAccount.userId
      },
      include: sessionUserRelations
    });
    await softDeleteUserWithoutConnectableIdentities(oldUser as LoggedInUser);
  }
  return getUserProfile('id', userId);
}
