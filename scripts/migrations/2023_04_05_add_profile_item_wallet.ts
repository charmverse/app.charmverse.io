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
    await prisma.profileItem.update({
      where: {
        id: profileItem.id
      },
      data: {
        address: profileItem.user.wallets[0].address,
      }
    })
  }
}

init();