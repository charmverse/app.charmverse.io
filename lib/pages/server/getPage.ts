import { prisma } from '@charmverse/core/prisma';
import type { PrismaTransactionClient, Prisma } from '@charmverse/core/prisma';
import { validate } from 'uuid';

import type { IPageWithPermissions } from '../interfaces';

export async function getPage(
  pageIdOrPath: string,
  spaceId?: string,
  tx: PrismaTransactionClient = prisma
): Promise<IPageWithPermissions | null> {
  const isValidUUid = validate(pageIdOrPath);

  // We need a spaceId if looking up by path
  if (!isValidUUid && !spaceId) {
    return null;
  }

  const searchQuery: Prisma.PageWhereInput = isValidUUid
    ? {
        id: pageIdOrPath
      }
    : {
        path: pageIdOrPath,
        spaceId
      };

  return tx.page.findFirst({
    where: searchQuery,
    include: {
      permissions: {
        include: {
          sourcePermission: true
        }
      }
    }
  });
}
