import { prisma } from '@charmverse/core/prisma-client';

/**
 * Use this script to perform database searches.
 */

async function search() {
  const result = await prisma.user.findFirst({
    where: {
      username: 'mattcasey.eth'
    },
    include: {
      verifiedEmails: true,
      wallets: true,
      googleAccounts: true,
      spaceRoles: true
    }
  });
  console.log(result);
}

search().then(() => console.log('Done'));
