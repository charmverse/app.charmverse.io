import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from 'lib/utils/strings';

/**
 * Use this script to perform database searches.
 */

async function query() {
  // const result = await prisma.page.findMany({
  //   where: {
  //      title: 'Optimism Protocol Registry'
  //   },
  //   select: {
  //     id: true,
  //     type: true,
  //     path: true
  //   }
  // });

  const result = await prisma.user.findFirst({
    where: {
      username: 'xandradozet.eth'
    },
    select: {
      id: true,
      username: true,
    }
  })

  prettyPrint(result);
}

query();
