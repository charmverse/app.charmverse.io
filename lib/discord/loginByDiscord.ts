import { prisma } from 'db';
import { getDiscordAccount } from 'lib/discord/getDiscordAccount';

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
          telegramUser: true,
          gnosisSafeState: true
        }
      }
    }
  });

  if (discordUser) {

    return discordUser.user;
  }
  else {

    const { id, ...rest } = discordAccount;

    const newUser = await prisma.user.create({
      data: {
        username: discordAccount.username,
        avatar: discordAccount.avatar ? `https://cdn.discordapp.com/avatars/${discordAccount.id}/${discordAccount.avatar}.png` : undefined,
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
        telegramUser: true,
        gnosisSafeState: true
      }
    });

    return newUser;
  }
}
