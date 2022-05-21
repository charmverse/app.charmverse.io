import { prisma } from 'db';
import { getDiscordAccount } from 'lib/discord/getDiscordAccount';
import { uploadToS3 } from 'lib/aws/uploadToS3Server';
import { v4 as uuid } from 'uuid';

export default async function loginByDiscord ({ code, hostName }: { code: string, hostName?: string }) {

  const discordAccount = await getDiscordAccount(code, hostName?.startsWith('localhost') ? `http://${hostName}/api/discord/callback` : 'https://app.charmverse.io/api/discord/callback');
  const discordUser = await prisma.discordUser.findUnique({
    where: {
      discordId: discordAccount.id
    },
    include: {
      user: {
        include: {
          favorites: true,
          spaceRoles: {
            include: {
              spaceRoleToRole: {
                include: {
                  role: true
                }
              }
            }
          },
          discordUser: true,
          telegramUser: true
        }
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
      const { url } = await uploadToS3({ fileName: `user-content/${userId}/${uuid()}/${decodeURIComponent(new URL(avatarUrl).pathname.split('/').pop() || '')?.replace(/\s/g, '-') || uuid()}`, url: avatarUrl });
      avatar = url;
    }

    const newUser = await prisma.user.create({
      data: {
        id: userId,
        username: discordAccount.username,
        avatar,
        discordUser: {
          create: {
            account: rest as any,
            discordId: id
          }
        }
      },
      include: {
        favorites: true,
        spaceRoles: {
          include: {
            spaceRoleToRole: {
              include: {
                role: true
              }
            }
          }
        },
        discordUser: true,
        telegramUser: true
      }
    });

    return newUser;
  }
}
