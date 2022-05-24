import { Prisma } from '@prisma/client';
import { prisma } from 'db';
import { v4, validate } from 'uuid';
import { IPageWithPermissions } from '../interfaces';

export async function getPage (pageIdOrPath: string): Promise<IPageWithPermissions | null> {

  const searchQuery: Prisma.PageWhereInput = validate(pageIdOrPath) === false ? {
    id: pageIdOrPath
  } : {
    path: pageIdOrPath
  };

  return prisma.page.findFirst({
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

