import { prisma } from '@charmverse/core/prisma-client';

/**
 * Use this script to perform database searches.
 */

async function search() {
  const result = await prisma.page.findFirstOrThrow({
    where: {
      path: 'page-6902650775784975'
    },
    include: {
      permissions: true
    }
  });
  console.log(result.id);
}

search().then(() => console.log('Done'));
