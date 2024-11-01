import type { Scout } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

export type UserResult = Scout & { githubLogin?: string };

// find a single user, from scouts or waitlist record. Eventually this doesnt need to search waitlist
export async function getUser(userId: string): Promise<UserResult | null> {
  const user = await prisma.scout.findFirst({
    where: {
      id: userId
    },
    include: {
      githubUser: true
    }
  });
  return user ? { ...user, githubLogin: user?.githubUser[0]?.login } : null;
}
