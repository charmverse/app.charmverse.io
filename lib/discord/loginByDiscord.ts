import { prisma } from '@charmverse/core';
import { log } from '@charmverse/core/log';
import { v4 } from 'uuid';

import { isProdEnv, isStagingEnv } from 'config/constants';
import { getUserS3FilePath, uploadUrlToS3 } from 'lib/aws/uploadToS3Server';
import { getDiscordAccount } from 'lib/discord/getDiscordAccount';
import type { SignupAnalytics } from 'lib/metrics/mixpanel/interfaces/UserEvent';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { updateTrackUserProfile } from 'lib/metrics/mixpanel/updateTrackUserProfile';
import { logSignupViaDiscord } from 'lib/metrics/postToDiscord';
import { sessionUserRelations } from 'lib/session/config';
import { DisabledAccountError } from 'lib/utilities/errors';
import { uid } from 'lib/utilities/strings';

type LoginWithDiscord = {
  code: string;
  hostName?: string;
  discordApiUrl?: string;
  userId?: string;
  signupAnalytics?: Partial<SignupAnalytics>;
};

export async function loginByDiscord({
  code,
  hostName,
  discordApiUrl,
  userId = v4(),
  signupAnalytics = {}
}: LoginWithDiscord) {
  const domain = isProdEnv || isStagingEnv ? `https://${hostName}` : `http://${hostName}`;
  const discordAccount = await getDiscordAccount({
    code,
    discordApiUrl,
    redirectUrl: `${domain}/api/discord/callback`
  });
  const discordUser = await prisma.discordUser.findUnique({
    where: {
      discordId: discordAccount.id
    },
    include: {
      user: {
        include: sessionUserRelations
      }
    }
  });

  if (discordUser) {
    if (discordUser.user.deletedAt) {
      throw new DisabledAccountError();
    }

    trackUserAction('sign_in', { userId: discordUser.user.id, identityType: 'Discord' });
    return discordUser.user;
  } else {
    const { id, ...rest } = discordAccount;
    const avatarUrl = discordAccount.avatar
      ? `https://cdn.discordapp.com/avatars/${discordAccount.id}/${discordAccount.avatar}.png`
      : undefined;
    let avatar: string | null = null;
    if (avatarUrl) {
      try {
        ({ url: avatar } = await uploadUrlToS3({
          pathInS3: getUserS3FilePath({ userId, url: avatarUrl }),
          url: avatarUrl
        }));
      } catch (error) {
        log.warn('Error while uploading avatar to S3', error);
      }
    }

    const newUser = await prisma.user.create({
      data: {
        id: userId,
        username: discordAccount.username,
        identityType: 'Discord',
        avatar,
        discordUser: {
          create: {
            account: rest as any,
            discordId: id
          }
        },
        path: uid(),
        profile: {
          create: {
            social: {
              discordUsername: discordAccount.username
            }
          }
        }
      },
      include: sessionUserRelations
    });

    updateTrackUserProfile(newUser);
    trackUserAction('sign_up', { userId: newUser.id, identityType: 'Discord', ...signupAnalytics });
    logSignupViaDiscord();

    return newUser;
  }
}
