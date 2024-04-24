import { prisma } from '@charmverse/core/prisma-client';

/**
 * Use this script to perform database searches.
 */

async function search() {
  const bountyCards = await prisma.bounty.count({
    where: {
      page: {
        type: "card"
      },
      space: {
        domain: {
          startsWith: "cvt-"
        }
      }
    }
  })

  console.log(`Bounty cards: ${bountyCards}`);
}


search().then(() => console.log('Done'));