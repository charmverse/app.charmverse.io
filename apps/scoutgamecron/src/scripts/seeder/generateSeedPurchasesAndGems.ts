import { prisma } from "@charmverse/core/prisma-client";
import { DateTime } from "luxon";
import { generateNftPurchaseEvents } from "./generateNftPurchaseEvents";
import { generateScout } from "./generateScout";
import { currentSeason, getCurrentWeek } from "@packages/scoutgame/dates";




async function generateScoutsSeedPurchasesAndGems() {

  const builderNfts = await prisma.builderNft.findMany({
  });

  if (!builderNfts.length) {
    throw new Error('No builderNft found');
  }

  const currentWeek = getCurrentWeek();

  for (const nft of builderNfts) {
    await prisma.userWeeklyStats.upsert({
      where: {
        userId_week: {
          userId: nft.builderId,
          week: currentWeek
        }
      },
      create: {
        userId: nft.builderId,
        week: currentWeek,
        season: currentSeason,
        gemsCollected: Math.ceil(Math.random() * 500),
      },
      update: {
        gemsCollected: {
          increment: Math.ceil(Math.random() * 100)
        }
      }
    })
  }



  for (let i = 0; i < 10; i++) {
    const scout = await generateScout({ index: i });


    await generateNftPurchaseEvents(scout.id, builderNfts.map(nft => ({builderNftId: nft.id, nftPrice: 200})), DateTime.fromMillis(Date.now()))
  }
}
