import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

export async function createBotUser(spaceId: string) {
  const botUser = await prisma.user.create({
    data: {
      username: 'Bot',
      isBot: true,
      identityType: 'RandomName',
      path: v4()
    }
  });

  const botSpaceRole = await prisma.spaceRole.create({
    data: {
      spaceId,
      userId: botUser.id,
      isAdmin: true
    }
  });

  return botUser;
}
