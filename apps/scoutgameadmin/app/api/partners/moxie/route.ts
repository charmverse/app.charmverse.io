import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason, getLastWeek } from '@packages/scoutgame/dates';
import { airstackRequest } from '@packages/scoutgame/moxie/airstackRequest';
import { getMoxieFanToken } from '@packages/scoutgame/moxie/getMoxieFanToken';
import { uniq } from 'lodash';

import { respondWithTSV } from 'lib/nextjs/respondWithTSV';

export const dynamic = 'force-dynamic';

type MoxieBonusRow = {
  'Builder FID': number;
  'Builder path': string;
  'Builder event': string;
  'Scout FID': number;
  'Scout email': string;
  'Scout path': string;
};

export async function GET() {
  const lastWeek = getLastWeek();
  const builders = await prisma.scout.findMany({
    where: {
      builderStatus: 'approved'
    },
    orderBy: {
      farcasterId: 'asc'
    },
    select: {
      farcasterId: true,
      path: true,
      events: {
        where: {
          type: {
            in: ['merged_pull_request', 'daily_commit']
          },
          week: lastWeek
        }
      },
      builderNfts: {
        where: {
          season: currentSeason
        },
        select: {
          nftSoldEvents: {
            select: {
              scout: {
                select: {
                  farcasterId: true,
                  path: true
                }
              }
            }
          }
        }
      }
    }
  });
  const rows: MoxieBonusRow[] = [];

  await Promise.all(
    builders.map(async (builder) => {
      if (builder.farcasterId && builder.events.length > 0) {
        // TODO: record moxie fan token data so we dont have to look it up again
        const moxieNft = await getMoxieFanToken(builder.farcasterId);
        if (moxieNft) {
          const scoutFids = builder.builderNfts
            .map((nft) => nft.nftSoldEvents.map((e) => e.scout.farcasterId))
            .flat()
            .filter(Boolean);
          for (const scoutFid of uniq(scoutFids)) {
            const fanTokenAmount = await getMoxieFanTokenAmount({
              builderFid: builder.farcasterId,
              scoutFid: scoutFid!
            });
            const scout = await prisma.scout.findUnique({
              where: {
                farcasterId: scoutFid!
              }
            });
            if (fanTokenAmount && scout) {
              // console.log('found scout with fan token', builder.farcasterId, scoutFid, fanTokenAmount);
              rows.push({
                'Scout FID': scoutFid!,
                'Scout email': scout.email || '',
                'Scout path': scout.path!,
                'Builder FID': builder.farcasterId,
                'Builder path': builder.path!,
                'Builder event':
                  (builder.events[0]!.type === 'merged_pull_request' ? `PR on ` : `Commit on `) +
                  builder.events[0]!.createdAt.toDateString()
              });
            }
          }
        }
      }
    })
  );

  return respondWithTSV(rows, `partners-export_moxie_${lastWeek}.tsv`);
}

export async function getMoxieFanTokenAmount({
  builderFid,
  scoutFid
}: {
  builderFid: number;
  scoutFid: number;
}): Promise<number> {
  const query = `
    query GetPortfolioInfo {
      MoxieUserPortfolios(
        input: {
          filter: {
            fid: {_eq: "${scoutFid}"},
            fanTokenSymbol: {
              # Fan Token to check, symbol will be based on types:
              # - User: fid:<FID>
              # - Channel: cid:<CHANNEL-ID>
              # - Network: id:farcaster
              _eq: "fid:${builderFid}"
            }
          }
        }
      ) {
        MoxieUserPortfolio {
          amount: totalUnlockedAmount
        }
      }
    }
  `;
  const data = await airstackRequest(query);
  // console.log('data', data);
  return data.data.MoxieUserPortfolios.MoxieUserPortfolio?.[0]?.amount || 0;
}
