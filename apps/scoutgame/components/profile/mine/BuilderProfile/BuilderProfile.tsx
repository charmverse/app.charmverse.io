import { prisma } from '@charmverse/core/prisma-client';
import { Stack, Typography } from '@mui/material';
import { currentSeason, getCurrentScoutGameWeek, getCurrentWeek } from '@packages/scoutgame/utils';
import { isTruthy } from '@root/lib/utils/types';
import Link from 'next/link';

import type { ScoutInfo } from 'components/scout/ScoutCard';
import { ScoutsGallery } from 'components/scout/ScoutsGallery';

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
        take: 5,
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
              // Skip closed pull requests
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

  const nftPurchaseEvents = await prisma.nFTPurchaseEvent.findMany({
    where: {
      builderEvent: {
        builderId,
        season: currentSeason
      }
    },
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
  });

  const uniqueScoutIds = Array.from(new Set(nftPurchaseEvents.map((event) => event.scout.id).filter(isTruthy)));
  const scoutsRecord: Record<string, ScoutInfo> = {};

  nftPurchaseEvents.forEach((event) => {
    const existingScout = scoutsRecord[event.scout.id];
    if (!existingScout) {
      scoutsRecord[event.scout.id] = {
        username: event.scout.username,
        avatar: event.scout.avatar || '',
        displayName: event.scout.displayName,
        nfts: 0
      };
    }
    scoutsRecord[event.scout.id].nfts += event.tokensPurchased;
  });

  const totalNftsSold = Object.values(scoutsRecord).reduce((acc, scout) => acc + scout.nfts, 0);

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
        <Stack direction='row' alignItems='center' justifyContent='space-between'>
          <Typography color='secondary'>Recent Activity</Typography>
          <Link href='/notifications'>
            <Typography color='primary'>View All</Typography>
          </Link>
        </Stack>
        <BuilderActivitiesList events={builder.events} />
      </Stack>
      <Stack gap={0.5}>
        <Typography color='secondary'>Scouted By</Typography>
        <ScoutsGallery scouts={Object.values(scoutsRecord)} />
      </Stack>
    </Stack>
  );
}
