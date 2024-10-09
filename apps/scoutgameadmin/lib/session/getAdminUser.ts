import { prisma } from '@charmverse/core/prisma-client';
import { isProdEnv } from '@root/config/constants';

const whitelistedIds: string[] = [];

export async function getAdminUser({ fid }: { fid: number }) {
  const user = await prisma.scout.findFirstOrThrow({ where: { farcasterId: fid } });
  if (!isProdEnv) {
    return user;
  }
  if (whitelistedIds.includes(user.id)) {
    return user;
  }
  return null;
}
