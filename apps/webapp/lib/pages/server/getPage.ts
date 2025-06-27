import type { Prisma } from '@charmverse/core/prisma';
import type { PrismaTransactionClient } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { PageWithPermissions } from '@packages/core/pages';
import { validate } from 'uuid';

import { generatePageQuery } from './generatePageQuery';

export async function getPage(
  pageIdOrPath: string,
  spaceId?: string,
  tx: PrismaTransactionClient = prisma
): Promise<PageWithPermissions | null> {
  const isValidUUid = validate(pageIdOrPath);

  // We need a spaceId if looking up by path
  if (!isValidUUid && !spaceId) {
    return null;
  }

  const searchQuery: Prisma.PageWhereInput = generatePageQuery({
    pageIdOrPath,
    spaceIdOrDomain: spaceId
  });

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
