import { uuid } from '@bangle.dev/utils';
import { prisma } from 'db';

async function init() {
  const wallets = await prisma.userWallet.findMany({
    select: {
      address: true
    }
  });

  for (const wallet of wallets) {
    await prisma.userWallet.update({
      data: {
        id: uuid()
      },
      where: {
        address: wallet.address
      }
    })
  }

  const profileItems = await prisma.profileItem.findMany({
    select : {
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
  })

  for (const profileItem of profileItems) {
    if (profileItem.user.wallets.length === 1) {
      await prisma.profileItem.update({
        where: {
          id: profileItem.id
        },
        data: {
          walletId: profileItem.user.wallets[0].id,
        }
      })
    }
  }
}

init();