import { prisma } from '@charmverse/core/prisma-client';

export async function fetchUserByFarcasterUsername(username: string) {
  const user = await prisma.user.findFirst({
    where: {
      farcasterUser: {
        account: {
          path: ['username'],
          equals: username
        }
      }
    },
    select: {
      farcasterUser: true,
      id: true
    }
  });

  return user;
}
