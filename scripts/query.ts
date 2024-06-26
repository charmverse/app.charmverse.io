import { getCurrentEvaluation } from '@charmverse/core/proposals';
import { prisma } from '@charmverse/core/prisma-client';

/**
 * Use this script to perform database searches.
 */

// {
//   id: 'dd047716-9512-447a-b9fd-79bfe8ccb280',
//   name: 'Greenpill Network'
// }


async function search() {
  const result = await prisma.space.findFirstOrThrow({
    where: {
      
    },
    select: {
      id: true,
      paidTier: true,
    }
  });
}
search().then(() => console.log('Done'));
