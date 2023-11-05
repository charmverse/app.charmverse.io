import { prisma } from '@charmverse/core/prisma-client';

export async function updateUserDiscordSocial({
  userId,
  discordUsername
}: {
  userId: string;
  discordUsername: string;
}) {
  const userProfile = await prisma.userDetails.findFirst({ where: { id: userId } });

  if (!userProfile) {
    return prisma.userDetails.create({ data: { id: userId, social: { discordUsername } } });
  }

  const social = (userProfile.social as Record<string, string>) || {};

  // Update only when the discord username is not set
  if (!social.discordUsername) {
    social.discordUsername = discordUsername;

    return prisma.userDetails.update({
      where: { id: userId },
      data: { id: userId, social: { discordUsername } }
    });
  }
}
