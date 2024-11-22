import type { Scout } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { getBuildersLeaderboard } from '@packages/scoutgame/builders/getBuildersLeaderboard';
import { getLastWeek } from '@packages/scoutgame/dates';
import { getTalentProfile } from '@packages/scoutgame/talent/getTalentProfile';

import { respondWithTSV } from 'lib/nextjs/respondWithTSV';

export const dynamic = 'force-dynamic';

const minimumTalentScore = 75;

export async function GET() {
  const lastWeek = getLastWeek();
  const topBuilders = await getBuildersLeaderboard({
    week: lastWeek
  });

  const buildersWithTalent: {
    wallet: string;
    score: number;
    rank: number;
    builder: Pick<Scout, 'displayName' | 'path' | 'email'>;
  }[] = [];

  for (const builder of topBuilders) {
    const fullBuilder = await prisma.scout.findUniqueOrThrow({
      where: {
        id: builder.builder.id
      },
      select: {
        farcasterId: true,
        displayName: true,
        path: true,
        email: true,
        talentProfile: {
          select: {
            id: true,
            score: true,
            address: true
          }
        },
        scoutWallet: {
          select: {
            address: true
          }
        }
      }
    });

    const { scoutWallet, farcasterId } = fullBuilder;

    if (fullBuilder.talentProfile) {
      const talentProfile = fullBuilder.talentProfile;
      if (talentProfile.score >= minimumTalentScore) {
        buildersWithTalent.push({
          rank: builder.rank,
          builder: fullBuilder,
          score: talentProfile.score,
          wallet: talentProfile.address
        });
      }
    } else {
      const wallets = scoutWallet.map((wallet) => wallet.address);
      const talentProfile = await getTalentProfile({
        farcasterId,
        wallets,
        minimumTalentScore
      });

      if (talentProfile) {
        buildersWithTalent.push({
          ...talentProfile,
          rank: builder.rank,
          builder: fullBuilder,
          score: talentProfile.score
        });
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
    'Wallet Address': wallet,
    'Scout Game Rank': rank,
    'Talent Score': score
  }));

  return respondWithTSV(rows, `partners-export_talent_${lastWeek}.tsv`);
}
