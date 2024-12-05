import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/dates';

async function refreshBuildersNftSoldStat() {
  const builderNfts = await prisma.builderNft.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    where: {
      nftSoldEvents: {
        some: {}
      },
      season: currentSeason
    },
    select: {
      builderId: true,
      nftSoldEvents: {
        select: {
          tokensPurchased: true
        }
      }
    }
  });

  let total = builderNfts.length;
  let current = 0;

  for (const builderNft of builderNfts) {
    const nftsSold = builderNft.nftSoldEvents.reduce((acc, event) => acc + event.tokensPurchased, 0);
    try {
      await prisma.userSeasonStats.update({
        where: { userId_season: { userId: builderNft.builderId, season: currentSeason } },
        data: { nftsSold }
      });
      current++;
      if (current % 10 === 0) {
        console.log(`Updated ${current} of ${total} builderNfts`);
      }
    } catch (error) {
      console.error(`Error updating user ${builderNft.builderId}: ${error}`);
    }
  }
}

refreshBuildersNftSoldStat().catch((error) => {
  console.error('ERROR', error);
  process.exit(1);
});
