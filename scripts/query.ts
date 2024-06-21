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
      verifiedEmails: {
        some: {
          email: 'rev@limitless.network'
        }
      }
    },
    select: {
      id: true,
      paidTier: true,
    }
  });

  console.log(result);
  const result2 = await prisma.user.findFirst({
    where: {
      email: 'rev@revmiller.com'
    },
    include: {
      verifiedEmails: true,
      wallets: true,
      googleAccounts: true,
      spaceRoles: true
    }
  });
  console.log(result2);
}

search().then(() => console.log('Done'));
