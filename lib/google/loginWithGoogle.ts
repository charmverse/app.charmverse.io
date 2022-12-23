import { prisma } from 'db';
import { getUserProfile } from 'lib/users/getUser';
import { updateUserProfile } from 'lib/users/updateUserProfile';
import { InsecureOperationError, InvalidInputError, SystemError } from 'lib/utilities/errors';
import type { LoggedInUser } from 'models';

import { verifyGoogleToken } from './verifyGoogleToken';

export type LoginWithGoogleRequest = {
  accessToken: string;
  displayName: string;
  avatarUrl: string;
};
export async function loginWithGoogle({
  accessToken,
  displayName,
  avatarUrl
}: LoginWithGoogleRequest): Promise<LoggedInUser> {
  try {
    const verified = await verifyGoogleToken(accessToken);

    const email = verified.email;

    if (!email) {
      throw new InvalidInputError(`Email required to complete signup`);
    }

    const googleAccount = await prisma.googleAccount.findUnique({
      where: {
        email
      }
    });

    if (googleAccount) {
      if (googleAccount.name !== displayName || googleAccount.avatarUrl !== avatarUrl) {
        await prisma.googleAccount.update({
          where: {
            id: googleAccount.id
          },
          data: {
            avatarUrl,
            name: displayName
          }
        });

        return updateUserProfile(googleAccount.userId, { identityType: 'Google', username: displayName });
      } else {
        return getUserProfile('id', googleAccount.userId);
      }
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        email
      }
    });

    const createdGoogleAccount = await prisma.googleAccount.create({
      data: {
        name: displayName,
        avatarUrl,
        email,
        user: existingUser
          ? {
              connect: {
                id: existingUser.id
              }
            }
          : {
              create: {
                identityType: 'Google',
                username: displayName,
                avatar: avatarUrl
              }
            }
      }
    });

    return getUserProfile('id', createdGoogleAccount.userId);
  } catch (err) {
    if (err instanceof SystemError === false) {
      throw new InsecureOperationError(`Could not verify the Google ID token that was provided`);
    }

    throw err;
  }
}
