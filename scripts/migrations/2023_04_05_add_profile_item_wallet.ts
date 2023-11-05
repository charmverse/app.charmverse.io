import { prisma } from '@charmverse/core/prisma-client';

async function init() {
  const profileItems = await prisma.profileItem.findMany({
    select: {
      id: true,
      user: {
        select: {
          wallets: {
            select: {
              id: true
            }
          }
        }
      }
    }
  });

  for (const profileItem of profileItems) {
    if (profileItem.user.wallets.length === 1) {
      await prisma.profileItem.update({
        where: {
          id: profileItem.id
        },
        data: {
          walletId: profileItem.user.wallets[0].id
        }
      });
    }
  }
}

init();
