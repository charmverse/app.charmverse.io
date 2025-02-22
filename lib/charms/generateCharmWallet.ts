import { prisma } from '@charmverse/core/prisma-client';
import { isUniqueConstraintError } from '@packages/utils/errors/prisma';

type Params = { userId: string } | { spaceId: string };

export async function generateCharmWallet(params: Params) {
  try {
    const wallet = await prisma.charmWallet.create({
      data: {
        ...params
      }
    });

    return wallet;
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      // user / space already has a charm wallet
      return prisma.charmWallet.findUniqueOrThrow({ where: { ...params } });
    }

    throw err;
  }
}
