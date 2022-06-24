/* eslint-disable no-console */
import { Prisma } from '@prisma/client';
import { prisma } from 'db';
import { addSpaceOperations } from 'lib/permissions/spaces';

const CONCURRENT = 5;

const query: Prisma.SpaceWhereInput = {
  OR: [
    {
      defaultPagePermissionGroup: 'full_access'
    },
    {
      defaultPagePermissionGroup: 'editor'
    },
    {
      defaultPagePermissionGroup: null
    }
  ]
};

export async function assignDefaultSpacePermissions (skip = 0, totalInDb = 0): Promise<true> {

  totalInDb = totalInDb === 0 ? await prisma.space.count({
    where: query
  }) : totalInDb;

  const spaces = await prisma.space.findMany({
    skip,
    take: CONCURRENT,
    where: query,
    select: {
      defaultPagePermissionGroup: true,
      id: true
    }
  });

  if (spaces.length === 0) {
    return true;
  }

  const permissionsAdded = await Promise.all(spaces.map(s => addSpaceOperations<'space'>({
    forSpaceId: s.id,
    spaceId: s.id,
    operations: ['createPage']
  })));

  const first = skip + 1;
  const last = skip + 1 + CONCURRENT;

  console.log('Added create page for ', first, '-', last, ' / ', totalInDb);

  return assignDefaultSpacePermissions(skip + CONCURRENT);

}

assignDefaultSpacePermissions()
  .then(() => {
    console.log('Job complete');
  });
