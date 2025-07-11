import { prisma } from '@charmverse/core/prisma-client';
import { log } from '@packages/core/log';
import type { GoogleLoginOauthParams } from '@packages/lib/google/authorization/authClient';
import type { SignupAnalytics } from '@packages/metrics/mixpanel/interfaces/UserEvent';
import { trackOpSpaceClickSigninEvent } from '@packages/metrics/mixpanel/trackOpSpaceSigninEvent';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import { updateTrackUserProfile } from '@packages/metrics/mixpanel/updateTrackUserProfile';
import { sessionUserRelations } from '@packages/profile/constants';
import { getUserProfile } from '@packages/profile/getUser';
import type { LoggedInUser } from '@packages/profile/getUser';
import { postUserCreate } from '@packages/users/postUserCreate';
import { DisabledAccountError, InsecureOperationError, InvalidInputError, SystemError } from '@packages/utils/errors';
import { uid } from '@packages/utils/strings';

import { verifyGoogleToken } from './verifyGoogleToken';

export type LoginWithGoogleRequest = {
  accessToken: string;
  displayName?: string;
  avatarUrl?: string;
  signupAnalytics?: Partial<SignupAnalytics>;
  oauthParams?: GoogleLoginOauthParams;
};
export async function loginWithGoogle({
  accessToken,
  displayName: providedDisplayName,
  avatarUrl: providedAvatarUrl,
  signupAnalytics = {},
  oauthParams
}: LoginWithGoogleRequest): Promise<LoggedInUser> {
  try {
    const verified = await verifyGoogleToken(accessToken, oauthParams);

    const email = verified.email;
    const displayName = providedDisplayName || verified.name || '';
    const avatarUrl = providedAvatarUrl || verified.picture || '';

    if (!email) {
      throw new InvalidInputError(`Email required to complete signup`);
    }

    const [matchedUser, verifiedEmail, userWithNotificationEmail] = await Promise.all([
      prisma.user.findFirst({
        where: {
          googleAccounts: {
            some: {
              email
            }
          }
        },
        include: sessionUserRelations
      }),
      prisma.verifiedEmail.findUnique({
        where: {
          email
        },
        include: {
          user: {
            include: sessionUserRelations
          }
        }
      }),
      prisma.user.findFirst({
        where: {
          email
        },
        include: sessionUserRelations
      })
    ]);

    let user: LoggedInUser | null = matchedUser;

    if (user?.deletedAt) {
      throw new DisabledAccountError(`This account has been disabled`);
    }

    if (!matchedUser && verifiedEmail) {
      await prisma.googleAccount.create({
        data: {
          avatarUrl,
          email,
          name: displayName,
          user: { connect: { id: verifiedEmail.userId } }
        }
      });
      user = verifiedEmail.user;
    } else if (!matchedUser && userWithNotificationEmail) {
      await prisma.googleAccount.create({
        data: {
          avatarUrl,
          email,
          name: displayName,
          user: { connect: { id: userWithNotificationEmail.id } }
        }
      });
      user = userWithNotificationEmail;
    } else if (!matchedUser) {
      user = await prisma.user.create({
        data: {
          username: email,
          path: uid(),
          googleAccounts: {
            create: {
              avatarUrl,
              email,
              name: displayName
            }
          }
        },
        include: sessionUserRelations
      });

      postUserCreate({ user, identityType: 'Google', signupAnalytics });
    } else {
      await prisma.googleAccount.update({
        where: {
          email
        },
        data: {
          avatarUrl,
          name: displayName
        }
      });
    }

    trackUserAction('sign_in', { userId: (user as LoggedInUser).id, identityType: 'Google' });

    await trackOpSpaceClickSigninEvent({
      userId: (user as LoggedInUser).id,
      identityType: 'Google'
    });

    const updatedUser = await getUserProfile('id', (user as LoggedInUser).id);

    updateTrackUserProfile(updatedUser);

    log.info(`User ${(user as LoggedInUser).id} logged in with Google`, {
      userId: (user as LoggedInUser).id,
      method: 'google'
    });

    return updatedUser;
  } catch (err) {
    if (err instanceof SystemError === false) {
      throw new InsecureOperationError(`Could not verify the Google ID token that was provided`);
    }

    throw err;
  }
}
