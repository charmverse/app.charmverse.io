import { log } from '@charmverse/core/log';
import type { Scout } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { getFarcasterUserById } from '@packages/farcaster/getFarcasterUserById';
import { getBuildersLeaderboard } from '@packages/scoutgame/builders/getBuildersLeaderboard';
import { getLastWeek } from '@packages/scoutgame/dates';
import { GET as httpGET } from '@packages/utils/http';

import { respondWithTSV } from 'lib/nextjs/respondWithTSV';

export const dynamic = 'force-dynamic';

const minimumTalentScore = 75;

export async function GET() {
  const lastWeek = getLastWeek();
  const topBuilders = await getBuildersLeaderboard({
    week: lastWeek
  });

  const buildersWithTalent: { wallet: string; score: number; rank: number; builder: Scout }[] = [];
  for (const builder of topBuilders) {
    let wallets = await prisma.scoutWallet.findMany({
      where: {
        scoutId: builder.builder.id
      },
      select: {
        address: true
      }
    });
    const { farcasterId } = await prisma.scout.findUniqueOrThrow({
      where: {
        id: builder.builder.id
      },
      select: {
        farcasterId: true
      }
    });

    if (wallets.length === 0 && farcasterId) {
      const farcasterProfile = await getFarcasterUserById(farcasterId);
      // console.log('farcasterProfile', farcasterProfile?.verifications);
      wallets = farcasterProfile?.verifications.map((address) => ({ address }));
      log.debug('Found wallets from Farcaster', { farcasterId, wallets });
    }
    let foundScore = false;
    for (const wallet of wallets) {
      const walletScore = !foundScore ? await getWalletScore(wallet.address).catch(() => null) : null;
      if (walletScore && walletScore > minimumTalentScore) {
        const scout = await prisma.scout.findUniqueOrThrow({
          where: {
            id: builder.builder.id
          }
        });
        buildersWithTalent.push({ wallet: wallet.address, rank: builder.rank, score: walletScore, builder: scout });
        foundScore = true;
      }
    }
    // grab the first 5 builders with 'talent'
    if (buildersWithTalent.length >= 5) {
      break;
    }
  }

  const rows = buildersWithTalent.map(({ builder, rank, wallet, score }) => ({
    'User Name': builder.displayName,
    'Profile Link': `https://scoutgame.xyz/u/${builder.path}`,
    Email: builder.email,
    'Scout Game Rank': rank,
    'Wallet Address': wallet,
    'Talent Score': score
  }));

  return respondWithTSV(rows, `partners-export_talent_${lastWeek}.tsv`);
}

// https://docs.talentprotocol.com/docs/developers/talent-api/api-reference/talent-passports
type PassportResponse = {
  passport: {
    score: number;
  };
};

async function getWalletPassport(address: string): Promise<PassportResponse> {
  // await rateLimiter();

  return httpGET(`https://api.talentprotocol.com/api/v2/passports/${address}`, {
    headers: {
      'X-API-KEY': process.env.TALENT_PROTOCOL_API_KEY
    }
  });
}

async function getWalletScore(address: string): Promise<number | null> {
  const result = await getWalletPassport(address);
  return result.passport.score || null;
}
