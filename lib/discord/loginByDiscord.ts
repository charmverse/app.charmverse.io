import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getUserS3FilePath, uploadUrlToS3 } from '@packages/aws/uploadToS3Server';
import type { SignupAnalytics } from '@packages/metrics/mixpanel/interfaces/UserEvent';
import { trackOpSpaceClickSigninEvent } from '@packages/metrics/mixpanel/trackOpSpaceSigninEvent';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import { logSignupViaDiscord } from '@packages/metrics/postToDiscord';
import { sessionUserRelations } from '@packages/profile/constants';
import { postUserCreate } from '@packages/users/postUserCreate';
import { DisabledAccountError } from '@packages/utils/errors';
import { uid } from '@packages/utils/strings';
import { getDiscordAccount } from '@root/lib/discord/client/getDiscordAccount';
import { getDiscordCallbackUrl } from '@root/lib/discord/getDiscordCallbackUrl';
import type { OauthFlowType } from '@root/lib/oauth/interfaces';
import { v4 } from 'uuid';

type LoginWithDiscord = {
  code: string;
  hostName?: string;
  discordApiUrl?: string;
  userId?: string;
  signupAnalytics?: Partial<SignupAnalytics>;
  authFlowType?: OauthFlowType;
};

export async function loginByDiscord({
  code,
  hostName,
  discordApiUrl,
  userId = v4(),
  signupAnalytics = {},
  authFlowType
}: LoginWithDiscord) {
  const discordAccount = await getDiscordAccount({
    code,
    discordApiUrl,
    redirectUrl: getDiscordCallbackUrl(hostName, authFlowType)
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

    await trackOpSpaceClickSigninEvent({
      userId: discordUser.user.id,
      identityType: 'Discord'
    });

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

    postUserCreate({ user: newUser, identityType: 'Discord', signupAnalytics });
    logSignupViaDiscord();

    return newUser;
  }
}
