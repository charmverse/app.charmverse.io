import { prisma } from 'db';
import { getDiscordAccount } from 'lib/discord/getDiscordAccount';
import { getUserS3Folder, uploadToS3 } from 'lib/aws/uploadToS3Server';
import { sessionUserRelations } from 'lib/session/config';
import { v4 as uuid } from 'uuid';
import { IDENTITY_TYPES } from 'models';
import { postToDiscord } from 'lib/log/userEvents';

export default async function loginByDiscord ({ code, hostName }: { code: string, hostName?: string }) {

  const discordAccount = await getDiscordAccount(code, hostName?.startsWith('localhost') ? `http://${hostName}/api/discord/callback` : 'https://app.charmverse.io/api/discord/callback');
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

    return discordUser.user;
  }
  else {

    const { id, ...rest } = discordAccount;
    const avatarUrl = discordAccount.avatar ? `https://cdn.discordapp.com/avatars/${discordAccount.id}/${discordAccount.avatar}.png` : undefined;
    let avatar: string | null = null;
    const userId = uuid();
    if (avatarUrl) {
      ({ url: avatar } = await uploadToS3({ fileName: getUserS3Folder({ userId, url: avatarUrl }), url: avatarUrl }));
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

    logSignupViaDiscord();

    return newUser;
  }
}

export async function logSignupViaDiscord () {
  postToDiscord({
    funnelStage: 'acquisition',
    eventType: 'create_user',
    message: 'A new user has joined Charmverse using their Discord account'
  });
}
