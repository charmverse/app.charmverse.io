import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason, getCurrentWeek } from '@packages/scoutgame/dates';

async function deleteScoutAndRedistributePoints() {
  const builderUsername = "ccdev5";
  const nftPurchaseEvents = await prisma.nFTPurchaseEvent.findMany({
    where: {
      builderNFT: {
        season: currentSeason,
        builder: {
          username: builderUsername
        }
      }
    },
    select: {
      id: true,
      tokensPurchased: true,
      scout: {
        select: {
          id: true,
        }
      }
    }
  });

  const nftPurchaseEventIds = nftPurchaseEvents.map((nftPurchaseEvent) => nftPurchaseEvent.id);
  const nftPurchaseEventsRecord: Record<string, number> = {};
  nftPurchaseEvents.forEach((nftPurchaseEvent) => {
    if (!nftPurchaseEventsRecord[nftPurchaseEvent.scout.id]) {
      nftPurchaseEventsRecord[nftPurchaseEvent.scout.id] = 0;
    }
    nftPurchaseEventsRecord[nftPurchaseEvent.scout.id] += nftPurchaseEvent.tokensPurchased;
  });

  await prisma.$transaction(async () => {
    await prisma.scout.delete({
      where: {
        username: builderUsername
      }
    })
    await prisma.nFTPurchaseEvent.deleteMany({
      where: {
        id: {
          in: nftPurchaseEventIds
        }
      }
    })
    for (const [scoutId, tokensPurchased] of Object.entries(nftPurchaseEventsRecord)) {
      const points = tokensPurchased * 20
      await prisma.pointsReceipt.create({
        data: {
          recipient: {
            connect: {
              id: scoutId
            }
          },
          activities: {
            create: {
              recipientType: "scout",
              type: "points",
              userId: scoutId,
            }
          },
          event: {
            create: {
              type: "misc_event",
              description: `You received a ${points} point gift from Scout Game`,
              season: currentSeason,
              week: getCurrentWeek(),
              builder: {
                connect: {
                  id: scoutId,
                }
              },
            }
          },
          claimedAt: new Date(),
          value: points,
        }
      })
      await prisma.userSeasonStats.update({
        where: {
          userId_season: {
            userId: scoutId,
            season: currentSeason
          }
        },
        data: {
          nftsPurchased: {
            decrement: tokensPurchased
          },
          pointsEarnedAsScout: {
            increment: points
          }
        }
      })
      await prisma.userAllTimeStats.update({
        where: {
          userId: scoutId
        },
        data: {
          pointsEarnedAsScout: {
            increment: points
          }
        }
      })
    }
  });
}