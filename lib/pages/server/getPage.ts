import { prisma } from '@charmverse/core';
import type { TransactionClient } from '@charmverse/core';
import type { Prisma } from '@charmverse/core/prisma';
import { validate } from 'uuid';

import type { IPageWithPermissions } from '../interfaces';

export async function getPage(
  pageIdOrPath: string,
  spaceId?: string,
  tx: TransactionClient = prisma
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
