import { prisma } from '@charmverse/core/prisma-client';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { currentSeason, getCurrentWeek } from '@packages/scoutgame/utils';
import { isTruthy } from '@root/lib/utils/types';

import { BuilderCard } from 'components/builder/Card/BuilderCard';
import { BuilderCardNftDisplay } from 'components/builder/Card/BuilderCardNftDisplay';

import { BuilderStats } from './BuilderStats';

export async function BuilderProfile({ builderId }: { builderId: string }) {
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
          week: getCurrentWeek()
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
              tokensPurchased: true,
              createdAt: true
            }
          },
          githubEvent: {
            select: {
              type: true,
              repo: {
                select: {
                  name: true,
                  owner: true
                }
              },
              createdAt: true
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
    <Stack gap={2}>
      <BuilderStats
        avatar={builder.avatar || ''}
        username={builder.username}
        builderPoints={builder.userSeasonStats[0]?.pointsEarnedAsBuilder || 0}
        totalScouts={uniqueScoutIds.length}
        totalNftsSold={totalNftsSold}
        currentNftPrice={Number(builder.builderNfts[0]?.currentPrice || 0)}
      />
    </Stack>
  );
}
