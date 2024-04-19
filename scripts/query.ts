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
  console.log(acc);

}


search().then(() => console.log('Done'));