import { prisma } from '@charmverse/core/prisma-client';
import { Stack, Typography } from '@mui/material';
import { currentSeason, getCurrentScoutGameWeek, getCurrentWeek } from '@packages/scoutgame/utils';
import { isTruthy } from '@root/lib/utils/types';

import { BuilderActivitiesList } from './BuilderActivitiesList';
import { BuilderStats } from './BuilderStats';
import { BuilderWeeklyStats } from './BuilderWeeklyStats';

export async function BuilderProfile({ builderId }: { builderId: string }) {
  const currentWeek = getCurrentWeek();
  const scoutgameWeek = getCurrentScoutGameWeek();

  const builder = await prisma.scout.findUniqueOrThrow({
    where: {
      id: builderId
    },
    select: {
      username: true,
      avatar: true,
      userSeasonStats: {
        where: {
          season: currentSeason
        },
        select: {
          pointsEarnedAsBuilder: true
        }
      },
      builderNfts: {
        where: {
          season: currentSeason
        },
        select: {
          currentPrice: true
        }
      },
      userWeeklyStats: {
        where: {
          week: currentWeek
        },
        select: {
          gemsCollected: true
        }
      },
      events: {
        where: {
          season: currentSeason
        },
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          createdAt: true,
          type: true,
          nftPurchaseEvent: {
            select: {
              scout: {
                select: {
                  username: true,
                  avatar: true,
                  displayName: true,
                  id: true
                }
              },
              tokensPurchased: true
            }
          },
          gemsReceipt: {
            select: {
              type: true,
              value: true
            }
          },
          githubEvent: {
            where: {
              type: 'merged_pull_request'
            },
            select: {
              repo: {
                select: {
                  name: true,
                  owner: true
                }
              }
            }
          }
        }
      }
    }
  });

  const nftPurchaseEvents = builder.events.filter((event) => event.type === 'nft_purchase');
  const totalNftsSold = nftPurchaseEvents.reduce(
    (acc, event) => acc + (event.nftPurchaseEvent?.tokensPurchased || 0),
    0
  );
  const uniqueScoutIds = Array.from(
    new Set(nftPurchaseEvents.map((event) => event.nftPurchaseEvent?.scout.id).filter(isTruthy))
  );

  return (
    <Stack gap={3}>
      <BuilderStats
        avatar={builder.avatar || ''}
        username={builder.username}
        builderPoints={builder.userSeasonStats[0]?.pointsEarnedAsBuilder || 0}
        totalScouts={uniqueScoutIds.length}
        totalNftsSold={totalNftsSold}
        currentNftPrice={Number(builder.builderNfts[0]?.currentPrice || 0)}
      />
      <Stack gap={0.5}>
        <Typography color='secondary'>This Week</Typography>
        <BuilderWeeklyStats gemsCollected={builder.userWeeklyStats[0]?.gemsCollected || 0} rank={1} />
      </Stack>
      <Stack gap={0.5}>
        <Typography color='secondary'>Recent Activity</Typography>
        <BuilderActivitiesList events={builder.events} />
      </Stack>
    </Stack>
  );
}
