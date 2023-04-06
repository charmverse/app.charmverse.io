import { prisma } from 'db';

async function init() {
  const profileItems = await prisma.profileItem.findMany({
    select : {
      id: true,
      user: {
        select: {
          wallets: {
            select: {
              address: true
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
          walletAddress: profileItem.user.wallets[0].address,
        }
      })
    }
  }
}

init();