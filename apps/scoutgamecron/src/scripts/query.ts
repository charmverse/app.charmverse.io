import { sendGemsPayoutEmails } from '../tasks/processGemsPayout/sendGemsPayoutEmails/sendGemsPayoutEmails';
import { prisma } from '@charmverse/core/prisma-client';
import { getOnchainPurchaseEvents } from '@packages/scoutgame/builderNfts/getOnchainPurchaseEvents';
import { prettyPrint } from '@packages/utils/strings';
import { syncUserNFTsFromOnchainData } from './syncUserNFTsFromOnchainData';

export async function query() {
  const scouts = await prisma.scout.findMany({
    where: {
      username: {
        in: ['kitana']
      }
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
      activities: true
    }
  });

  const data = await Promise.all(
    scouts.map(async (scout) => {
      const userPurchases = await getOnchainPurchaseEvents({ scoutId: scout.id });
      console.log(userPurchases.length);
      console.log(userPurchases.filter((p) => !p.nftPurchase).length);
    })
  );
  // await syncUserNFTsFromOnchainData({ scoutId: scouts[0].id });
  console.log('done');
  //prettyPrint(data);
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

query();
