import { prisma } from '@charmverse/core/prisma-client';

import type { GoogleLoginOauthParams } from 'lib/google/authorization/authClient';
import type { SignupAnalytics } from 'lib/metrics/mixpanel/interfaces/UserEvent';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { updateTrackUserProfile } from 'lib/metrics/mixpanel/updateTrackUserProfile';
import { sessionUserRelations } from 'lib/session/config';
import { getUserProfile } from 'lib/users/getUser';
import { DisabledAccountError, InsecureOperationError, InvalidInputError, SystemError } from 'lib/utilities/errors';
import { uid } from 'lib/utilities/strings';
import type { LoggedInUser } from 'models';

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

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          {
            googleAccounts: {
              some: {
                email
              }
            }
          },
          {
            verifiedEmails: {
              some: {
                email
              }
            }
          }
        ]
      },
      include: sessionUserRelations
    });

    if (user?.deletedAt) {
      throw new DisabledAccountError(`This account has been disabled`);
    }

    if (!user) {
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
      trackUserAction('sign_up', { userId: user.id, identityType: 'Google', ...signupAnalytics });
    } else {
      await prisma.googleAccount.upsert({
        where: {
          email
        },
        create: {
          avatarUrl,
          email,
          name: displayName,
          user: { connect: { id: user.id } }
        },
        update: {
          avatarUrl,
          name: displayName
        }
      });
    }

    trackUserAction('sign_in', { userId: user.id, identityType: 'Google' });

    const updatedUser = await getUserProfile('id', user.id);

    updateTrackUserProfile(updatedUser);

    return updatedUser;
  } catch (err) {
    if (err instanceof SystemError === false) {
      throw new InsecureOperationError(`Could not verify the Google ID token that was provided`);
    }

    throw err;
  }
}
