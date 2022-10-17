import { v4 as uuid } from 'uuid';

import { isProdEnv } from 'config/constants';
import { prisma } from 'db';
import { getUserS3FilePath, uploadUrlToS3 } from 'lib/aws/uploadToS3Server';
import { getDiscordAccount } from 'lib/discord/getDiscordAccount';
import log from 'lib/log';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { updateTrackUserProfile } from 'lib/metrics/mixpanel/updateTrackUserProfile';
import { logSignupViaDiscord } from 'lib/metrics/postToDiscord';
import { sessionUserRelations } from 'lib/session/config';
import { IDENTITY_TYPES } from 'models';

export default async function loginByDiscord ({ code, hostName, discordApiUrl }: { code: string, hostName?: string, discordApiUrl?: string }) {

  const domain = isProdEnv ? `https://${hostName}` : `http://${hostName}`;
  const discordAccount = await getDiscordAccount({ code, discordApiUrl, redirectUrl: `${domain}/api/discord/callback` });
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
    trackUserAction('sign_in', { userId: discordUser.user.id, identityType: 'Discord' });
    return discordUser.user;
  }
  else {

    const { id, ...rest } = discordAccount;
    const avatarUrl = discordAccount.avatar ? `https://cdn.discordapp.com/avatars/${discordAccount.id}/${discordAccount.avatar}.png` : undefined;
    let avatar: string | null = null;
    const userId = uuid();
    if (avatarUrl) {
      try {
        ({ url: avatar } = await uploadUrlToS3({ pathInS3: getUserS3FilePath({ userId, url: avatarUrl }), url: avatarUrl }));
      }
      catch (error) {
        log.warn('Error while uploading avatar to S3', error);
      }
    }

    const newUser = await prisma.user.create({
      data: {
        id: userId,
        username: discordAccount.username,
        identityType: IDENTITY_TYPES[1],
        avatar,
        discordUser: {
          create: {
            account: rest as any,
            discordId: id
          }
        }
      },
      include: sessionUserRelations
    });

    updateTrackUserProfile(newUser);
    trackUserAction('sign_up', { userId: newUser.id, identityType: 'Discord' });
    logSignupViaDiscord();

    return newUser;
  }
}

