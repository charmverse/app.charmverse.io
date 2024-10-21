import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason, getLastWeek } from '@packages/scoutgame/dates';
import { RateLimit } from 'async-sema';
import { uniq } from 'lodash';

import { respondWithTSV } from 'lib/nextjs/respondWithTSV';

export const dynamic = 'force-dynamic';

type MoxieBonusRow = {
  'Builder FID': number;
  'Builder username': string;
  'Builder event': string;
  'Scout FID': number;
  'Scout email': string;
  'Scout username': string;
};

export async function GET() {
  const builders = await prisma.scout.findMany({
    where: {
      builderStatus: 'approved'
    },
    orderBy: {
      farcasterId: 'asc'
    },
    select: {
      farcasterId: true,
      username: true,
      events: {
        where: {
          type: {
            in: ['merged_pull_request', 'daily_commit']
          },
          week: getLastWeek()
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
                  username: true
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
                'Scout username': scout.username,
                'Builder FID': builder.farcasterId,
                'Builder username': builder.username,
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

  return respondWithTSV(rows, 'moxie_bonus_report.tsv');
}

type MoxieFanToken = {
  currentPrice: number;
  currentPriceInWei: number;
  dailyVolumeChange: number;
  fanTokenAddress: string;
  fanTokenName: string;
  fanTokenSymbol: string;
  lockedTvl: number;
  tlv: number;
  tokenLockedAmount: number;
  tokenUnlockedAmount: number;
  totalSupply: number;
  uniqueHolders: number;
  unlockedTvl: number;
};

export async function getMoxieFanToken(farcasterId: number): Promise<MoxieFanToken | null> {
  const query = `
    query MyQuery {
      MoxieFanTokens(
        input: {filter: {fanTokenSymbol: {_eq: "fid:${farcasterId}"}}, blockchain: ALL}
      ) {
        MoxieFanToken {
          currentPrice
          currentPriceInWei
          dailyVolumeChange
          fanTokenAddress
          fanTokenName
          fanTokenSymbol
          lockedTvl
          tlv
          tokenLockedAmount
          tokenUnlockedAmount
          totalSupply
          uniqueHolders
          unlockedTvl
        }
      }
    }
  `;
  const data = await getGQLQuery(query);
  return data.data.MoxieFanTokens.MoxieFanToken?.[0] || null;
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
  const data = await getGQLQuery(query);
  // console.log('data', data);
  return data.data.MoxieUserPortfolios.MoxieUserPortfolio?.[0]?.amount || 0;
}

// at most, 10 req per second
// Moxy's rate limit is 3000/min and burst of 300/second.
// @source https://docs.airstack.xyz/airstack-docs-and-faqs/api-capabilities#rate-limits
const rateLimiter = RateLimit(50);

async function getGQLQuery(query: string) {
  await rateLimiter();
  const response = await fetch('https://api.airstack.xyz/gql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: process.env.AIRSTACK_API_KEY as string
    },
    body: JSON.stringify({ query })
  });

  if (!response.ok) {
    log.debug('Error fetching Moxie NFT data:', { query, response });
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}
