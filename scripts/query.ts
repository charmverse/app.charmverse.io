import { getCurrentEvaluation } from '@charmverse/core/proposals';
import { prisma } from '@charmverse/core/prisma-client';

/**
 * Use this script to perform database searches.
 */

async function search() {
  const result = await prisma.user.findFirst({
    where: {
      verifiedEmails: {
        some: {
          email: 'rev@limitless.network'
        }
      }
    },
    include: {
      verifiedEmails: true,
      wallets: true,
      googleAccounts: true,
      spaceRoles: true
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
