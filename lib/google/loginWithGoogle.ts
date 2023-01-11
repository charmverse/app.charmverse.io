import { prisma } from 'db';
import type { SignupAnalytics } from 'lib/metrics/mixpanel/interfaces/UserEvent';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { updateTrackUserProfile } from 'lib/metrics/mixpanel/updateTrackUserProfile';
import { getUserProfile } from 'lib/users/getUser';
import { updateUserProfile } from 'lib/users/updateUserProfile';
import { DisabledAccountError, InsecureOperationError, InvalidInputError, SystemError } from 'lib/utilities/errors';
import type { LoggedInUser } from 'models';

import { verifyGoogleToken } from './verifyGoogleToken';

export type LoginWithGoogleRequest = {
  accessToken: string;
  displayName: string;
  avatarUrl: string;
  signupAnalytics?: Partial<SignupAnalytics>;
};
export async function loginWithGoogle({
  accessToken,
  displayName,
  avatarUrl,
  signupAnalytics = {}
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
      },
      include: {
        user: {
          select: {
            deletedAt: true
          }
        }
      }
    });

    if (googleAccount) {
      if (googleAccount.user.deletedAt) {
        throw new DisabledAccountError(`This account has been disabled`);
      }

      if (googleAccount.name !== displayName || googleAccount.avatarUrl !== avatarUrl) {
        trackUserAction('sign_in', { userId: googleAccount.userId, identityType: 'Google' });

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

    const createdGoogleAccount = await prisma.googleAccount.create({
      data: {
        name: displayName,
        avatarUrl,
        email,
        user: {
          create: {
            identityType: 'Google',
            username: displayName,
            avatar: avatarUrl
          }
        }
      }
    });

    const newUser = await getUserProfile('id', createdGoogleAccount.userId);

    updateTrackUserProfile(newUser);
    trackUserAction('sign_up', { userId: newUser.id, identityType: 'Google', ...signupAnalytics });

    return newUser;
  } catch (err) {
    if (err instanceof SystemError === false) {
      throw new InsecureOperationError(`Could not verify the Google ID token that was provided`);
    }

    throw err;
  }
}
