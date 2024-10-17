import { prisma } from '@charmverse/core/prisma-client';
import { getOnchainPurchaseEvents } from '@packages/scoutgame/builderNfts/getOnchainPurchaseEvents';
import { prettyPrint } from '@packages/utils/strings';
export async function query() {
  const scouts = await prisma.scout.findMany({
    where: {
      username: {
        in: ['username']
      }
      // id: {
      //   in: [
      //     '0ac531b3-ccb7-4247-8842-5957b2490289',
      //     '269b4f1c-6e53-4340-838d-2cf4fca38408',
      //     '3b3d87b4-1c76-4a38-9def-5cec1852f2e6',
      //     '86d748c0-0650-44d5-b762-24025e1fa69d',
      //     '933b7d8e-3c4f-4768-ae72-73808220e997',
      //     '9a8f1c02-db44-4a6c-8f2d-228603d514f2',
      //     'b664de9c-4b73-431e-92f3-9bdc0c4ed0c2',
      //     'eabe8002-07e7-41a0-b83a-067cd8cd0610'
      //   ]
      // }
    },
    orderBy: {
      id: 'asc'
    },
    include: {
      builderNfts: {
        include: {
          nftSoldEvents: true
        }
      },
      pointsReceived: true,
      pointsSent: true,
      activities: true,
    }
  });

  const data = await Promise.all(scouts.map(async (scout) => {
    const userPurchases = await getOnchainPurchaseEvents({ scoutId: scout.id });
    const waitlist = await prisma.connectWaitlistSlot.findUniqueOrThrow({where: {fid: scout.farcasterId as number}})
    return {
      ...scout,
      waitlist,
      userPurchases
    }
  }));

  return data;
  // const builderNft = await prisma.builderNft.findMany({
  //   where: {
  //     tokenId: {
  //       in: [5]
  //     }
  //   },
  //   include: {
  //     builder: true
  //   }
  // });
  // console.log(builderNft);
}
query().then(prettyPrint);
