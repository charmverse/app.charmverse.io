import { prisma } from '@charmverse/core/prisma-client';

/**
 * Use this script to perform database searches.
 */

async function search() {
  const acc = await prisma.page.findMany({
    where: {
      title: 'daos'
    }
  });

  const pages = await prisma.page.findMany({
    where: {
      type: {
        not: 'proposal',
      },
      permissions: {
        some: {
          permissionLevel: 'proposal_editor'
        }
      }
    },
    select: {
      id: true,
      title: true,
      type: true,
      createdAt: true,
      space: {
        select: {
          domain: true
        }
      },
      permissions: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  prettyPrint(pages);
}

search().then(() =>null);
