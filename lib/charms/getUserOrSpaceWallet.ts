import type { CharmWallet } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { generateCharmWallet } from 'lib/charms/generateCharmWallet';

export async function getUserOrSpaceWallet(
  params: ({ userId: string } | { spaceId: string }) & { readOnly?: boolean }
): Promise<CharmWallet | null> {
  const wallet = await prisma.charmWallet.findUnique({ where: { ...params } });

  if (!wallet && !params.readOnly) {
    return generateCharmWallet(params);
  }

  return wallet;
}
