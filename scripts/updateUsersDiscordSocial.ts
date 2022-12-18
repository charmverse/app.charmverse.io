import { prisma } from 'db';
import { updateUserDiscordSocial } from 'pages/api/discord/updateUserDiscordSocial';

async function  updateUsersDiscordSocial() {
  let updatedCount = 0;

  const users = await prisma.discordUser.findMany();

  for (const discordUser of users) {
    const discordUsername = (discordUser.account as any)?.username as string | undefined;
    if (discordUsername) {
      await updateUserDiscordSocial({ userId: discordUser.userId, discordUsername });
      updatedCount += 1;
    }
  }

  console.log('🔥', updatedCount, 'users updated');
}

updateUsersDiscordSocial();