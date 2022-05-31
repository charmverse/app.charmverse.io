import getENSName from 'lib/blockchain/getENSName';
import { IdentityType, IDENTITY_TYPES, LoggedInUser } from 'models';
import { DiscordAccount } from 'lib/discord/getDiscordAccount';
import { TelegramAccount } from 'pages/api/telegram/connect';
import { shortenHex } from 'lib/utilities/strings';
import { prisma } from '../db';

(async () => {

  const users: Array<Partial<LoggedInUser>> = await prisma.user.findMany({
    where: {
      identityType: null
    },
    include: {
      discordUser: true,
      telegramUser: true
    }
  });

  console.log('found', users.length, 'users missing identity type');

  let ensFound = 0;

  await Promise.all(users.map(async user => {
    if (!user.addresses) {
      return;
    }
    const address = user.addresses[0];
    const ens: string | null = await getENSName(address);

    user.ensName = ens || undefined;
    ensFound += 1;
  }));

  console.log('Found', ensFound, 'ens names');

  await prisma.$transaction(
    users.map((user) => {
      if (!user.username && user.addresses?.[0]) {
        return prisma.user.update({
          where: {
            id: user.id
          },
          data: {
            identityType: IDENTITY_TYPES[0],
            username: user.ensName || shortenHex(user.addresses[0])
          }
        });
      }

      let identityType: IdentityType = IDENTITY_TYPES[0];
      const discordAccount = user.discordUser ? user.discordUser.account as Partial<DiscordAccount> : null;
      const telegramAccount = user.telegramUser ? user.telegramUser.account as Partial<TelegramAccount> : null;

      if (user.discordUser
            && discordAccount
            && discordAccount.username === user.username) {
        // Check for scenario in which user has both Discord and Telegram, same username, but connected with Telegram last.
        identityType = telegramAccount
                            && telegramAccount.username === user.username
                            && user.telegramUser
                            && user.telegramUser.createdAt > user.discordUser.createdAt
          ? IDENTITY_TYPES[2] : IDENTITY_TYPES[1];
      }
      else if (telegramAccount
        && (telegramAccount.username === user.username || user.username === `${telegramAccount.first_name} ${telegramAccount.last_name}`)) {
        identityType = IDENTITY_TYPES[2];
      }

      return prisma.user.update({
        where: {
          id: user.id
        },
        data: {
          identityType
        }
      });
    })
  );

})();
