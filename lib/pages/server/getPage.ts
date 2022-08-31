import { Prisma } from '@prisma/client';
import { prisma } from 'db';
import { validate } from 'uuid';
import { IPageWithPermissions } from '../interfaces';

export async function getPage (pageIdOrPath: string, spaceId?: string): Promise<IPageWithPermissions | null> {

  const isValidUUid = validate(pageIdOrPath);

  // We need a spaceId if looking up by path
  if (!isValidUUid && !spaceId) {
    return null;
  }

  const searchQuery: Prisma.PageWhereInput = isValidUUid ? {
    id: pageIdOrPath
  } : {
    path: pageIdOrPath,
    spaceId
  };

  return prisma.page.findFirst({
    where: searchQuery,
    include: {
      permissions: {
        include: {
          sourcePermission: true
        }
      },
      proposal: {
        include: {
          authors: true,
          reviewers: true
        }
      }
    }
  });
}

