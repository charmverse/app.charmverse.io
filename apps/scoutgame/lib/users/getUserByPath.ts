import { prisma } from '@charmverse/core/prisma-client';

export async function getUserByPath(username: string) {
  const user = await prisma.scout.findFirst({
    where: {
      username
    }
  });

  return user;
}
