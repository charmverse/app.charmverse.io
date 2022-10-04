import { prisma } from 'db';
import { getDiscordAccount } from 'lib/discord/getDiscordAccount';
import { getUserS3FilePath, uploadUrlToS3 } from 'lib/aws/uploadToS3Server';
import { sessionUserRelations } from 'lib/session/config';
import { v4 as uuid } from 'uuid';
import { IDENTITY_TYPES } from 'models';
import { postToDiscord } from 'lib/log/userEvents';
import log from 'lib/log';
import { trackUserAction, updateTrackUserProfile } from 'lib/metrics/mixpanel/server';

export default async function loginByDiscord ({ code, hostName }: { code: string, hostName?: string }) {

  const domain = process.env.NODE_ENV === 'development' ? `http://${hostName}` : `https://${hostName}`;
  const discordAccount = await getDiscordAccount(code, `${domain}/api/discord/callback`);
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

async function logSignupViaDiscord () {
  postToDiscord({
    funnelStage: 'acquisition',
    eventType: 'create_user',
    message: 'A new user has joined Charmverse using their Discord account'
  });
}
